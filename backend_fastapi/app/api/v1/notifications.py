"""Notification endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, PaginationDep, get_db
from app.models.enums import NotificationChannel, NotificationType
from app.schemas.common import Page
from app.schemas.notification import (
    AlertPreferenceResponse,
    AlertPreferenceUpdate,
    DeviceTokenCreate,
    DeviceTokenResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=Page[NotificationResponse], summary="List my notifications")
async def list_notifications(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    pagination: PaginationDep = None,  # type: ignore[assignment]
    unread_only: bool = Query(default=False),
) -> Page[NotificationResponse]:
    rows, total = await NotificationService(db).list_for_user(
        user_id=user.id,
        unread_only=unread_only,
        page=pagination.page,
        page_size=pagination.page_size,
    )
    pages = (total + pagination.page_size - 1) // pagination.page_size if pagination.page_size else 0
    return Page[NotificationResponse](
        items=[
            NotificationResponse(
                id=str(r.id),
                user_id=str(r.user_id),
                type=NotificationType(r.type),
                title=r.title,
                body=r.body,
                payload=dict(r.payload or {}),
                is_read=r.is_read,
                read_at=r.read_at,
                dedupe_key=r.dedupe_key,
                created_at=r.created_at,
            )
            for r in rows
        ],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Number of unread notifications",
)
async def unread_count(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UnreadCountResponse:
    n = await NotificationService(db).unread_count(user.id)
    return UnreadCountResponse(unread_count=n)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark one notification as read",
)
async def mark_read(
    notification_id: uuid.UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> NotificationResponse:
    row = await NotificationService(db).mark_read(
        user_id=user.id, notification_id=notification_id
    )
    if row is None:
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Notification not found")
    await db.commit()
    return NotificationResponse(
        id=str(row.id),
        user_id=str(row.user_id),
        type=NotificationType(row.type),
        title=row.title,
        body=row.body,
        payload=dict(row.payload or {}),
        is_read=row.is_read,
        read_at=row.read_at,
        dedupe_key=row.dedupe_key,
        created_at=row.created_at,
    )


@router.post(
    "/read-all",
    summary="Mark all notifications as read",
    status_code=status.HTTP_200_OK,
)
async def mark_all_read(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> dict:
    n = await NotificationService(db).mark_all_read(user.id)
    await db.commit()
    return {"updated": n}


@router.get(
    "/preferences",
    response_model=AlertPreferenceResponse,
    summary="Get my alert preferences",
)
async def get_preferences(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> AlertPreferenceResponse:
    pref = await NotificationService(db).get_or_create_preferences(user.id)
    await db.commit()
    return AlertPreferenceResponse(
        id=str(pref.id),
        user_id=str(pref.user_id),
        enabled_types=[NotificationType(t) for t in (pref.enabled_types or [])],
        channels=[NotificationChannel(c) for c in (pref.channels or [])],
        match_threshold=pref.match_threshold,
        quiet_hours_start=pref.quiet_hours_start,
        quiet_hours_end=pref.quiet_hours_end,
        timezone=pref.timezone,
    )


@router.put(
    "/preferences",
    response_model=AlertPreferenceResponse,
    summary="Update my alert preferences",
)
async def update_preferences(
    payload: AlertPreferenceUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> AlertPreferenceResponse:
    pref = await NotificationService(db).update_preferences(
        user_id=user.id,
        enabled_types=[t.value for t in payload.enabled_types],
        channels=[c.value for c in payload.channels],
        match_threshold=payload.match_threshold,
        quiet_hours_start=payload.quiet_hours_start,
        quiet_hours_end=payload.quiet_hours_end,
        timezone_str=payload.timezone,
    )
    await db.commit()
    return AlertPreferenceResponse(
        id=str(pref.id),
        user_id=str(pref.user_id),
        enabled_types=[NotificationType(t) for t in (pref.enabled_types or [])],
        channels=[NotificationChannel(c) for c in (pref.channels or [])],
        match_threshold=pref.match_threshold,
        quiet_hours_start=pref.quiet_hours_start,
        quiet_hours_end=pref.quiet_hours_end,
        timezone=pref.timezone,
    )


@router.post(
    "/device-tokens",
    response_model=DeviceTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a push device token",
)
async def register_device_token(
    payload: DeviceTokenCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> DeviceTokenResponse:
    from sqlalchemy import select

    from app.models.notification import DeviceToken

    existing = (
        await db.execute(select(DeviceToken).where(DeviceToken.token == payload.token))
    ).scalar_one_or_none()
    if existing is None:
        existing = DeviceToken(user_id=user.id, token=payload.token, platform=payload.platform)
        db.add(existing)
    else:
        existing.user_id = user.id
        existing.platform = payload.platform
    await db.commit()
    await db.refresh(existing)
    return DeviceTokenResponse(
        id=str(existing.id),
        token=existing.token,
        platform=existing.platform,
        created_at=existing.created_at,
    )

@router.delete(
    "/device-tokens/{token}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Remove a push device token",
)
async def delete_device_token(
    token: str,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> Response:
    from sqlalchemy import delete as _d

    from app.models.notification import DeviceToken

    await db.execute(
        _d(DeviceToken).where(
            DeviceToken.token == token, DeviceToken.user_id == user.id
        )
    )
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)