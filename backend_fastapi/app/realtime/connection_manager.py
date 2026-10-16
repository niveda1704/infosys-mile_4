"""WebSocket connection manager with a Redis Pub/Sub bridge (in-memory fallback).

Delivery model
--------------
* ``send_to_user`` delivers to the sockets held by *this* process, then publishes the
  message on ``notifications:{user_id}`` (wrapped with this instance's id).
* A background subscriber listens on ``notifications:*`` and delivers messages that
  were published by *other* instances to the local sockets. Messages published by this
  same instance are skipped, so nothing is delivered twice.
* If Redis is unavailable the manager keeps working in-memory (single process); the
  subscriber keeps retrying with exponential backoff and re-enables Redis delivery
  automatically when it comes back.
"""
from __future__ import annotations

import asyncio
import contextlib
import json
import logging
import uuid
from collections import defaultdict
from typing import Any

from fastapi import WebSocket

from app.core.config import settings

logger = logging.getLogger(__name__)

_CHANNEL_PREFIX = "notifications:"
_SEND_TIMEOUT_SECONDS = 5.0


class ConnectionManager:
    """Tracks WebSocket connections per user and bridges them through Redis."""

    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()
        self._instance_id = uuid.uuid4().hex
        self._redis_pub = None
        self._redis_ready = False
        self._sub_task: asyncio.Task | None = None

    # ---------- lifecycle ----------
    async def startup(self) -> None:
        if not settings.REDIS_URL:
            logger.info("ConnectionManager: no REDIS_URL - using in-memory delivery only")
            return
        await self._connect_publisher()
        # The subscriber task owns reconnection, so start it even if Redis is down now.
        self._sub_task = asyncio.create_task(self._subscribe_loop(), name="ws-redis-subscriber")

    async def _connect_publisher(self) -> bool:
        try:
            from redis.asyncio import Redis

            if self._redis_pub is None:
                self._redis_pub = Redis.from_url(settings.REDIS_URL, decode_responses=True)
            await self._redis_pub.ping()
            if not self._redis_ready:
                logger.info("ConnectionManager: connected to Redis")
            self._redis_ready = True
            return True
        except Exception as exc:  # noqa: BLE001
            if self._redis_ready or self._redis_pub is None:
                logger.warning("ConnectionManager: Redis unavailable (%s); in-memory only", exc)
            self._redis_ready = False
            return False

    async def shutdown(self) -> None:
        if self._sub_task is not None:
            self._sub_task.cancel()
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await self._sub_task
            self._sub_task = None
        for conns in list(self._connections.values()):
            for ws in list(conns):
                try:
                    await ws.close()
                except Exception as exc:  # noqa: BLE001
                    logger.debug("ws close during shutdown failed: %s", exc)
        self._connections.clear()
        if self._redis_pub is not None:
            try:
                await self._redis_pub.aclose()
            except Exception as exc:  # noqa: BLE001
                logger.debug("redis close during shutdown failed: %s", exc)
            self._redis_pub = None
            self._redis_ready = False

    # ---------- registration ----------
    async def connect(self, user_id: str, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections[user_id].add(ws)

    async def disconnect(self, user_id: str, ws: WebSocket) -> None:
        async with self._lock:
            if user_id in self._connections:
                self._connections[user_id].discard(ws)
                if not self._connections[user_id]:
                    del self._connections[user_id]

    # ---------- local delivery ----------
    async def _send_one(self, ws: WebSocket, payload: str) -> bool:
        try:
            await asyncio.wait_for(ws.send_text(payload), timeout=_SEND_TIMEOUT_SECONDS)
            return True
        except Exception:  # noqa: BLE001
            return False

    async def _deliver_local(self, user_id: str, payload: str) -> None:
        conns = list(self._connections.get(user_id, set()))
        if not conns:
            return
        # Concurrent sends with a per-socket timeout: one slow client cannot stall the rest.
        results = await asyncio.gather(*(self._send_one(ws, payload) for ws in conns))
        dead = [ws for ws, ok in zip(conns, results) if not ok]
        if dead:
            async with self._lock:
                bucket = self._connections.get(user_id)
                if bucket is not None:
                    for ws in dead:
                        bucket.discard(ws)
                    if not bucket:
                        del self._connections[user_id]

    # ---------- send ----------
    async def send_to_user(self, user_id: uuid.UUID, message: dict[str, Any]) -> None:
        payload = json.dumps(message, default=str)
        await self._deliver_local(str(user_id), payload)

        # Publish so that other instances can deliver to their own connections.
        if self._redis_ready and self._redis_pub is not None:
            envelope = json.dumps({"origin": self._instance_id, "payload": payload})
            try:
                await self._redis_pub.publish(f"{_CHANNEL_PREFIX}{user_id}", envelope)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Redis publish failed: %s", exc)
                self._redis_ready = False  # the subscriber loop will restore it

    # ---------- redis subscriber ----------
    async def _subscribe_loop(self) -> None:
        backoff = 1.0
        while True:
            pubsub = None
            try:
                if not await self._connect_publisher():
                    raise ConnectionError("redis not reachable")
                pubsub = self._redis_pub.pubsub()
                await pubsub.psubscribe(f"{_CHANNEL_PREFIX}*")
                backoff = 1.0
                while True:
                    msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    if msg is None:
                        continue
                    await self._handle_redis_message(msg)
            except asyncio.CancelledError:
                if pubsub is not None:
                    try:
                        await pubsub.aclose()
                    except Exception as exc:  # noqa: BLE001
                        logger.debug("pubsub close on cancel failed: %s", exc)
                raise
            except Exception as exc:  # noqa: BLE001
                self._redis_ready = False
                logger.warning("ws redis subscriber error (%s); retrying in %.0fs", exc, backoff)
                if pubsub is not None:
                    try:
                        await pubsub.aclose()
                    except Exception as close_exc:  # noqa: BLE001
                        logger.debug("pubsub close failed: %s", close_exc)
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30.0)

    async def _handle_redis_message(self, msg: dict[str, Any]) -> None:
        try:
            channel = msg["channel"]
            if isinstance(channel, bytes):
                channel = channel.decode()
            user_id = channel[len(_CHANNEL_PREFIX):]
            data = msg["data"]
            if isinstance(data, bytes):
                data = data.decode()
            envelope = json.loads(data)
            if envelope.get("origin") == self._instance_id:
                return  # already delivered locally by send_to_user
            await self._deliver_local(user_id, envelope["payload"])
        except Exception as exc:  # noqa: BLE001
            logger.warning("Ignoring malformed pubsub message: %s", exc)


connection_manager = ConnectionManager()
