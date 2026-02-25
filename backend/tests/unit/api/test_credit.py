"""Unit tests for Credit API endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.core.security import create_access_token
from app.main import app
from app.models.credit_profile import CreditProfile
from app.models.user import User, UserRole
from httpx import ASGITransport, AsyncClient


def _make_user(role: UserRole = UserRole.KIOSK_OWNER, **overrides) -> MagicMock:
    defaults = dict(
        id=uuid.uuid4(),
        phone="+254700000000",
        name="Fatima",
        role=role,
        language_pref="en",
        telegram_chat_id=123456,
        distributor_id=None,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    defaults.update(overrides)
    user = MagicMock(spec=User)
    for k, v in defaults.items():
        setattr(user, k, v)
    return user


def _make_profile(user_id: uuid.UUID, **overrides) -> MagicMock:
    defaults = dict(
        id=uuid.uuid4(),
        user_id=user_id,
        credit_limit=Decimal("500.00"),
        current_balance=Decimal("120.00"),
        risk_score=None,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    defaults.update(overrides)
    profile = MagicMock(spec=CreditProfile)
    for k, v in defaults.items():
        setattr(profile, k, v)
    return profile


def _auth_header(user: MagicMock) -> dict[str, str]:
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    app.dependency_overrides.clear()


def _setup_overrides(user: MagicMock) -> AsyncMock:
    mock_db = AsyncMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    mock_db.flush = AsyncMock()
    mock_db.add = MagicMock()

    from app.api.deps import get_current_user, get_db

    async def _fake_current_user():
        return user

    async def _fake_db():
        yield mock_db

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_db] = _fake_db
    return mock_db


async def test_get_credit_profile_existing() -> None:
    user = _make_user()
    profile = _make_profile(user.id)
    _setup_overrides(user)

    with patch(
        "app.repositories.credit_repo.CreditRepository.get_credit_profile",
        new_callable=AsyncMock,
        return_value=profile,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/api/v1/credit/profile", headers=_auth_header(user))

    assert resp.status_code == 200
    body = resp.json()
    assert body["user_id"] == str(user.id)
    assert Decimal(body["credit_limit"]) == Decimal("500.00")


async def test_get_credit_profile_auto_create() -> None:
    user = _make_user()
    new_profile = _make_profile(user.id, current_balance=Decimal("0.00"))
    _setup_overrides(user)

    with (
        patch(
            "app.repositories.credit_repo.CreditRepository.get_credit_profile",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "app.repositories.credit_repo.CreditRepository.create_default_profile",
            new_callable=AsyncMock,
            return_value=new_profile,
        ),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/api/v1/credit/profile", headers=_auth_header(user))

    assert resp.status_code == 200
    body = resp.json()
    assert Decimal(body["credit_limit"]) == Decimal("500.00")


async def test_get_credit_limit() -> None:
    user = _make_user()
    profile = _make_profile(
        user.id,
        credit_limit=Decimal("1000.00"),
        current_balance=Decimal("250.00"),
    )
    _setup_overrides(user)

    with patch(
        "app.repositories.credit_repo.CreditRepository.get_credit_profile",
        new_callable=AsyncMock,
        return_value=profile,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/api/v1/credit/limit", headers=_auth_header(user))

    assert resp.status_code == 200
    body = resp.json()
    assert Decimal(body["credit_limit"]) == Decimal("1000.00")
    assert Decimal(body["available_credit"]) == Decimal("750.00")


async def test_credit_profile_forbidden_for_distributor() -> None:
    user = _make_user(role=UserRole.DISTRIBUTOR)

    from app.api.deps import get_current_user, get_db

    async def _fake_current_user():
        return user

    mock_db = AsyncMock()

    async def _fake_db():
        yield mock_db

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_db] = _fake_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/credit/profile", headers=_auth_header(user))

    assert resp.status_code == 403
