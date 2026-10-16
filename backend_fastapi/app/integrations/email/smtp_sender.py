"""SMTP sender using aiosmtplib."""
from __future__ import annotations

from email.message import EmailMessage

import aiosmtplib

from app.core.config import settings


class SmtpSender:
    async def send(self, *, to: str, subject: str, body: str) -> None:
        msg = EmailMessage()
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(body)
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            start_tls=settings.SMTP_START_TLS,
            use_tls=settings.SMTP_USE_TLS,
            timeout=10,
        )