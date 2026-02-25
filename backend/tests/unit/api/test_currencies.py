"""Unit tests for Currencies API endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.api.deps import get_current_user, get_db, require_role
from app.core.security import create_access_token
from app.main import app
from app.models.currency import Currency
from app.models.user import User, UserRole
from httpx import ASGITransport, AsyncClient

PREFIX = "/api/v1/currencies"


def _make_currency(**overrides) -> MagicMock:
    defaults = {
        "id": uuid.uuid4(),
        "code": "ETB",
        "name": "Ethiopian Birr",
        "symbol": "Br",
        "decimal_places": 2,
        "is_default": True,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    defaults.update(overrides)
    c = MagicMock(spec=Currency)
    for k, v in defaults.items():
        setattr(c, k, v)
    return c


def _make_user(role: UserRole = UserRole.SUPER_ADMIN) -> MagicMock:
    user = MagicMock(spec=User)
    user.id = uuid.uuid4()
    user.phone = "+251900000000"
    user.role = role
    user.is_active = True
    return user


def _auth_headers(user: MagicMock) -> dict[str, str]:
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    app.dependency_overrides.clear()


async def test_list_currencies() -> None:
    currency = _make_currency()
    mock_db = AsyncMock()

    async def _fake_db():
        yield mock_db

    app.dependency_overrides[get_db] = _fake_db

    with patch(
        "app.repositories.currency_repo.CurrencyRepository.list_currencies",
        new_callable=AsyncMock,
    ) as mock_list:
        mock_list.return_value = ([currency], 1)
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get(PREFIX)

    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["code"] == "ETB"


async def test_list_currencies_active_only_param() -> None:
    mock_db = AsyncMock()

    async def _fake_db():
        yield mock_db

    app.dependency_overrides[get_db] = _fake_db

    with patch(
        "app.repositories.currency_repo.CurrencyRepository.list_currencies",
        new_callable=AsyncMock,
    ) as mock_list:
        mock_list.return_value = ([], 0)
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            await ac.get(f"{PREFIX}?active_only=false")

    mock_list.assert_called_once_with(active_only=False)


async def test_create_currency_requires_auth() -> None:
    payload = {
        "code": "USD",
        "name": "US Dollar",
        "symbol": "$",
        "decimal_places": 2,
        "is_default": False,
    }
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(PREFIX, json=payload)
    assert resp.status_code in (401, 403)


async def test_create_currency_success() -> None:
    currency = _make_currency(code="USD", name="US Dollar", symbol="$")
    user = _make_user(role=UserRole.SUPER_ADMIN)
    mock_db = AsyncMock()
    mock_db.commit = AsyncMock()

    async def _fake_db():
        yield mock_db

    async def _fake_user():
        return user

    app.dependency_overrides[get_db] = _fake_db
    app.dependency_overrides[get_current_user] = _fake_user
    app.dependency_overrides[require_role("admin", "super_admin")] = _fake_user

    with patch(
        "app.repositories.currency_repo.CurrencyRepository.create",
        new_callable=AsyncMock,
    ) as mock_create:
        mock_create.return_value = currency
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post(
                PREFIX,
                json={
                    "code": "USD",
                    "name": "US Dollar",
                    "symbol": "$",
                    "decimal_places": 2,
                    "is_default": False,
                },
                headers=_auth_headers(user),
            )

    assert resp.status_code == 201
    assert resp.json()["code"] == "USD"


async def test_update_currency_not_found() -> None:
    user = _make_user(role=UserRole.SUPER_ADMIN)
    mock_db = AsyncMock()
    mock_db.commit = AsyncMock()

    async def _fake_db():
        yield mock_db

    async def _fake_user():
        return user

    app.dependency_overrides[get_db] = _fake_db
    app.dependency_overrides[get_current_user] = _fake_user
    app.dependency_overrides[require_role("admin", "super_admin")] = _fake_user

    with patch(
        "app.repositories.currency_repo.CurrencyRepository.get_by_id",
        new_callable=AsyncMock,
    ) as mock_get:
        mock_get.return_value = None
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.put(
                f"{PREFIX}/{uuid.uuid4()}",
                json={"name": "Updated"},
                headers=_auth_headers(user),
            )

    assert resp.status_code == 404


async def test_delete_currency_requires_super_admin() -> None:
    user = _make_user(role=UserRole.ADMIN)
    mock_db = AsyncMock()

    async def _fake_db():
        yield mock_db

    async def _fake_user():
        return user

    app.dependency_overrides[get_db] = _fake_db
    app.dependency_overrides[get_current_user] = _fake_user
    app.dependency_overrides[require_role("super_admin")] = _fake_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.delete(f"{PREFIX}/{uuid.uuid4()}", headers=_auth_headers(user))

    assert resp.status_code == 403
