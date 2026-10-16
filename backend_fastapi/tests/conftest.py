"""Shared fixtures: test DB, HTTP client, factories, auth helpers."""
from __future__ import annotations

import asyncio
import io
import os
import uuid
from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ["ENVIRONMENT"] = "dev"
os.environ.setdefault("SECRET_KEY", "test-secret-key-which-is-at-least-32-chars-long")
os.environ.setdefault("REDIS_URL", "")  # tests use in-memory rate limiting / no Redis

_TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://swipex:swipex@localhost:5433/swipex_test",
)
# The suite runs drop_all/create_all, so it must NEVER point at a non-test database.
# Force the URL (setdefault would keep e.g. the compose container's dev DATABASE_URL) and
# refuse to run unless the database name clearly marks it as a test database.
if "test" not in _TEST_DB_URL.rsplit("/", 1)[-1].lower():
    raise RuntimeError(
        f"Refusing to run tests: database name in TEST_DATABASE_URL must contain 'test' "
        f"(got {_TEST_DB_URL.rsplit('/', 1)[-1]!r})."
    )
os.environ["DATABASE_URL"] = _TEST_DB_URL

from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import User  # noqa: E402
from app.models.enums import AuthProvider, UserRole  # noqa: E402

TEST_DB_URL = os.environ["DATABASE_URL"]


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        try:
            from app import models  # noqa: F401
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        except Exception as exc:  # noqa: BLE001
            pytest.skip(f"Postgres test DB unavailable: {exc}")
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncIterator[AsyncSession]:
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def user_factory(db_session: AsyncSession):
    from app.core.security import hash_password

    async def _make(
        *,
        email: str | None = None,
        password: str = "Passw0rd!",
        role: UserRole = UserRole.job_seeker,
        full_name: str = "Test User",
        is_active: bool = True,
    ) -> tuple[User, str]:
        user = User(
            email=(email or f"u{uuid.uuid4().hex[:8]}@example.com").lower(),
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role.value,
            auth_provider=AuthProvider.local.value,
            is_active=is_active,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user, password

    return _make


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient):
    async def _login(email: str, password: str) -> dict[str, str]:
        resp = await client.post(
            "/api/v1/auth/login", json={"email": email, "password": password}
        )
        assert resp.status_code == 200, resp.text
        return {"Authorization": f"Bearer {resp.json()['access_token']}"}

    return {"login": _login}


@pytest.fixture
def make_pdf_bytes():
    """Generate a minimal valid PDF with a text line."""

    def _make(
        text: str = "Python developer with experience in FastAPI and PostgreSQL",
    ) -> bytes:
        content = f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET"
        objects = []
        objects.append("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n")
        objects.append("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n")
        objects.append(
            "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            "/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>endobj\n"
        )
        objects.append(
            f"4 0 obj<< /Length {len(content)} >>stream\n{content}\nendstream\nendobj\n"
        )
        objects.append(
            "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n"
        )
        header = "%PDF-1.4\n"
        body = "".join(objects)
        offsets = []
        cursor = len(header)
        for obj in objects:
            offsets.append(cursor)
            cursor += len(obj)
        xref_start = cursor
        xref = "xref\n0 6\n0000000000 65535 f \n"
        for off in offsets:
            xref += f"{off:010d} 00000 n \n"
        trailer = (
            f"trailer<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n"
        )
        return (header + body + xref + trailer).encode("latin-1")

    return _make


@pytest.fixture
def make_docx_bytes():
    """Generate a minimal DOCX in-memory using python-docx."""

    def _make(
        text: str = (
            "Skills: Python, SQL, React. "
            "Experience: Senior Engineer at Acme 2020 - 2023"
        ),
    ) -> bytes:
        from docx import Document

        doc = Document()
        for line in text.split("."):
            doc.add_paragraph(line.strip())
        buf = io.BytesIO()
        doc.save(buf)
        return buf.getvalue()

    return _make