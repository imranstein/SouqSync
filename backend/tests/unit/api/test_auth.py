"""Unit tests for the Auth API endpoints."""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.main import app
from app.models.user import User, UserRole
from app.services import auth_service
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

API = settings.API_PREFIX


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ── Helpers ───────────────────────────────────────────────────────────


def _make_user(phone: str = "+212600000001") -> User:
    from unittest.mock import MagicMock

    user = MagicMock(spec=User)
    user.id = uuid.uuid4()
    user.phone = phone
    user.name = None
    user.role = UserRole.KIOSK_OWNER
    user.is_active = True
    return user


# ── POST /auth/request-otp ───────────────────────────────────────────


ROUTER_MODULE = "app.api.routers.auth"


@pytest.mark.asyncio
async def test_request_otp_returns_200(client: AsyncClient) -> None:
    with patch(f"{ROUTER_MODULE}.request_otp", new_callable=AsyncMock) as mock_req:
        mock_req.return_value = {"message": "OTP sent successfully", "expires_in": 300}
        resp = await client.post(f"{API}/auth/request-otp", json={"phone": "+212612345678"})

    assert resp.status_code == 200
    data = resp.json()
    assert data["message"] == "OTP sent successfully"
    assert data["expires_in"] == 300


@pytest.mark.asyncio
async def test_request_otp_invalid_phone(client: AsyncClient) -> None:
    resp = await client.post(f"{API}/auth/request-otp", json={"phone": "12"})
    assert resp.status_code == 422


# ── POST /auth/verify-otp ────────────────────────────────────────────


@pytest.mark.asyncio
async def test_verify_otp_returns_tokens(client: AsyncClient) -> None:
    fake_user = _make_user()
    with patch(f"{ROUTER_MODULE}.verify_otp", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = fake_user
        resp = await client.post(
            f"{API}/auth/verify-otp",
            json={"phone": "+212612345678", "code": "123456"},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    payload = decode_token(data["access_token"])
    assert payload["sub"] == str(fake_user.id)
    assert payload["type"] == "access"


@pytest.mark.asyncio
async def test_verify_otp_wrong_code(client: AsyncClient) -> None:
    with patch(f"{ROUTER_MODULE}.verify_otp", new_callable=AsyncMock) as mock_verify:
        mock_verify.side_effect = HTTPException(status_code=401, detail="Invalid or expired OTP")
        resp = await client.post(
            f"{API}/auth/verify-otp",
            json={"phone": "+212612345678", "code": "000000"},
        )

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid or expired OTP"


# ── POST /auth/refresh ───────────────────────────────────────────────


@pytest.mark.asyncio
async def test_refresh_returns_new_tokens(client: AsyncClient) -> None:
    user_id = str(uuid.uuid4())
    refresh = create_refresh_token(user_id)

    resp = await client.post(f"{API}/auth/refresh", json={"refresh_token": refresh})

    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    new_payload = decode_token(data["access_token"])
    assert new_payload["sub"] == user_id


@pytest.mark.asyncio
async def test_refresh_rejects_access_token(client: AsyncClient) -> None:
    access = create_access_token(str(uuid.uuid4()))

    resp = await client.post(f"{API}/auth/refresh", json={"refresh_token": access})

    assert resp.status_code == 401
    assert "Invalid token type" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_refresh_rejects_garbage_token(client: AsyncClient) -> None:
    resp = await client.post(f"{API}/auth/refresh", json={"refresh_token": "not.a.jwt"})

    assert resp.status_code == 401


# ── Security utilities ────────────────────────────────────────────────


def test_create_and_decode_access_token() -> None:
    subject = str(uuid.uuid4())
    token = create_access_token(subject, extra={"role": "admin"})
    payload = decode_token(token)
    assert payload["sub"] == subject
    assert payload["role"] == "admin"
    assert payload["type"] == "access"


def test_create_and_decode_refresh_token() -> None:
    subject = str(uuid.uuid4())
    token = create_refresh_token(subject)
    payload = decode_token(token)
    assert payload["sub"] == subject
    assert payload["type"] == "refresh"


# ── Rate limiting (in-memory fallback) ────────────────────────────────


@pytest.mark.asyncio
async def test_rate_limiting_in_memory() -> None:
    """Ensure the in-memory rate limiter kicks in after 3 requests."""
    auth_service._memory_store.clear()

    with patch.object(auth_service, "_get_redis", new_callable=AsyncMock, return_value=None):
        for _ in range(3):
            result = await auth_service.request_otp("+212699999999")
            assert result["message"] == "OTP sent successfully"

        with pytest.raises(HTTPException) as exc_info:
            await auth_service.request_otp("+212699999999")
        assert exc_info.value.status_code == 429

    auth_service._memory_store.clear()
