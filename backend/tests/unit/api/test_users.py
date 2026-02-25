"""Unit tests for Users API endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.core.security import create_access_token
from app.main import app
from app.models.user import User, UserRole
from httpx import ASGITransport, AsyncClient


def _make_user(**overrides) -> MagicMock:
    defaults = dict(
        id=uuid.uuid4(),
        phone="+254700000000",
        name="Fatima",
        role=UserRole.KIOSK_OWNER,
        language_pref="en",
        telegram_chat_id=123456,
        distributor_id=None,
        tenant_id=None,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    defaults.update(overrides)
    user = MagicMock(spec=User)
    for k, v in defaults.items():
        setattr(user, k, v)
    return user


def _auth_header(user: MagicMock) -> dict[str, str]:
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    app.dependency_overrides.clear()


async def test_get_me_success() -> None:
    user = _make_user()

    async def _fake_current_user():
        return user

    from app.api.deps import get_current_user

    app.dependency_overrides[get_current_user] = _fake_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/users/me", headers=_auth_header(user))

    assert resp.status_code == 200
    body = resp.json()
    assert body["phone"] == user.phone
    assert body["name"] == user.name


async def test_get_me_unauthorized() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/users/me")
    assert resp.status_code in (401, 403)


async def test_update_me_success() -> None:
    user = _make_user()
    mock_db = AsyncMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    from app.api.deps import get_current_user, get_db

    async def _fake_current_user():
        return user

    async def _fake_db():
        yield mock_db

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_db] = _fake_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.put(
            "/api/v1/users/me",
            json={"name": "New Name", "language_pref": "sw"},
            headers=_auth_header(user),
        )

    assert resp.status_code == 200


async def test_update_me_unauthorized() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.put("/api/v1/users/me", json={"name": "X"})
    assert resp.status_code in (401, 403)
