"""Auth business logic — OTP flow, token issuance, refresh."""

from __future__ import annotations

import time
from typing import TYPE_CHECKING, Any

import structlog
from fastapi import HTTPException, status
from sqlalchemy import select

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    hash_otp,
)
from app.models.user import User, UserRole
from app.schemas.auth import TokenResponse

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

OTP_TTL_SECONDS = 300  # 5 minutes
RATE_LIMIT_WINDOW = 900  # 15 minutes
RATE_LIMIT_MAX = 3

# ── In-memory fallback when Redis is unavailable ──────────────────────
_memory_store: dict[str, Any] = {}


async def _get_redis():  # type: ignore[no-untyped-def]
    """Return an async Redis client, or *None* if Redis is unreachable."""
    try:
        import redis.asyncio as aioredis

        client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await client.ping()
        return client
    except Exception:
        logger.warning("redis_unavailable", msg="Falling back to in-memory OTP store")
        return None


def _mem_get(key: str) -> str | None:
    entry = _memory_store.get(key)
    if entry is None:
        return None
    value, expires_at = entry
    if time.time() > expires_at:
        _memory_store.pop(key, None)
        return None
    return value


def _mem_set(key: str, value: str, ttl: int) -> None:
    _memory_store[key] = (value, time.time() + ttl)


def _mem_incr_with_ttl(key: str, ttl: int) -> int:
    entry = _memory_store.get(key)
    if entry is None or time.time() > entry[1]:
        _memory_store[key] = ("1", time.time() + ttl)
        return 1
    count = int(entry[0]) + 1
    _memory_store[key] = (str(count), entry[1])
    return count


# ── Public API ────────────────────────────────────────────────────────


async def request_otp(phone: str) -> dict:
    """Generate OTP and store it (Redis preferred, in-memory fallback)."""
    redis = await _get_redis()

    rate_key = f"otp:rate:{phone}"
    otp_key = f"otp:{phone}"

    if redis:
        count = await redis.incr(rate_key)
        if count == 1:
            await redis.expire(rate_key, RATE_LIMIT_WINDOW)
        if count > RATE_LIMIT_MAX:
            await redis.aclose()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many OTP requests. Try again later.",
            )
        code = generate_otp()
        await redis.set(otp_key, hash_otp(code), ex=OTP_TTL_SECONDS)
        await redis.aclose()
    else:
        count = _mem_incr_with_ttl(rate_key, RATE_LIMIT_WINDOW)
        if count > RATE_LIMIT_MAX:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many OTP requests. Try again later.",
            )
        code = generate_otp()
        _mem_set(otp_key, hash_otp(code), OTP_TTL_SECONDS)

    if settings.DEBUG:
        logger.info("otp_generated", phone=phone, otp=code)  # MVP: logged, not sent via SMS
    return {"message": "OTP sent successfully", "expires_in": OTP_TTL_SECONDS}


async def verify_otp(phone: str, code: str, db: AsyncSession) -> User:
    """Validate OTP, create user if new, return user."""
    redis = await _get_redis()
    otp_key = f"otp:{phone}"

    if redis:
        stored_hash = await redis.get(otp_key)
        if stored_hash and stored_hash == hash_otp(code):
            await redis.delete(otp_key)
            await redis.aclose()
        else:
            if redis:
                await redis.aclose()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired OTP",
            )
    else:
        stored_hash = _mem_get(otp_key)
        if stored_hash and stored_hash == hash_otp(code):
            _memory_store.pop(otp_key, None)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired OTP",
            )

    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(phone=phone, role=UserRole.KIOSK_OWNER)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info("user_created", phone=phone, user_id=str(user.id))
    else:
        logger.info("user_authenticated", phone=phone, user_id=str(user.id))

    return user


async def refresh_tokens(refresh_token: str) -> TokenResponse:
    """Validate a refresh token and issue a new access/refresh pair."""
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    subject: str = payload["sub"]
    return TokenResponse(
        access_token=create_access_token(subject),
        refresh_token=create_refresh_token(subject),
    )
