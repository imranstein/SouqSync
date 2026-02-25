"""Health check endpoints."""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.db.database import engine
from app.schemas.common import HealthResponse

router = APIRouter()


async def _check_db() -> str:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return "ok"
    except Exception:
        return "unavailable"


async def _check_redis() -> str:
    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(settings.REDIS_URL)
        await r.ping()
        await r.aclose()
        return "ok"
    except Exception:
        return "unavailable"


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    db_status = await _check_db()
    redis_status = await _check_redis()
    return HealthResponse(
        status="ok" if db_status == "ok" and redis_status == "ok" else "degraded",
        app=settings.APP_NAME,
        database=db_status,
        redis=redis_status,
    )


@router.get("/health/ready")
async def readiness() -> dict[str, str]:
    return {"status": "ready"}
