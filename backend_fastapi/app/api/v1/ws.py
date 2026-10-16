"""WebSocket endpoint for real-time notifications."""
from __future__ import annotations

import asyncio
import logging
import uuid

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.core.security import decode_token
from app.db.session import SessionLocal
from app.realtime.connection_manager import connection_manager
from app.repositories.user_repo import UserRepository

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ws"])


@router.websocket("/ws/notifications")
async def ws_notifications(
    websocket: WebSocket,
    token: str = Query(default=""),
) -> None:
    # Handshake: validate the access JWT
    if not token:
        await websocket.close(code=4401)
        return
    try:
        payload = decode_token(token, expected_type="access")
    except JWTError:
        await websocket.close(code=4401)
        return

    sub = payload.get("sub")
    if not sub:
        await websocket.close(code=4401)
        return
    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        await websocket.close(code=4401)
        return

    # Verify the user still exists / is active
    async with SessionLocal() as session:
        user = await UserRepository(session).get_by_id(user_id)
        if user is None or not user.is_active:
            await websocket.close(code=4401)
            return

    await connection_manager.connect(str(user_id), websocket)
    try:
        # Heartbeat + receive loop (client pings via any text; server replies "pong")
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=30)
            except asyncio.TimeoutError:
                # server-side heartbeat ping
                await websocket.send_text('{"type":"ping"}')
                continue
            if msg.strip().lower() in ("ping", '{"type":"ping"}'):
                await websocket.send_text('{"type":"pong"}')
    except WebSocketDisconnect:
        logger.debug("WebSocket disconnected for user %s", user_id)
    except Exception:  # noqa: BLE001
        logger.exception("WebSocket error for user %s", user_id)
    finally:
        await connection_manager.disconnect(str(user_id), websocket)