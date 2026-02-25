"""Settings — brand, feature flags, backup stub, check-for-updates."""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

import httpx
from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user, get_db, require_role
from app.repositories.setting_repo import SettingRepository
from app.schemas.setting import (
    BrandSettings,
    FeatureFlagsResponse,
)

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

    from app.models.user import User

router = APIRouter()

BRAND_KEYS = ["app_name", "logo_url", "primary_color", "accent_color"]
FEATURE_PREFIX = "feature."


@router.get("/brand", response_model=BrandSettings)
async def get_brand(
    tenant_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandSettings:
    repo = SettingRepository(db)
    effective_tenant_id = tenant_id
    if current_user.role.value != "super_admin":
        effective_tenant_id = current_user.tenant_id
    vals = await repo.get_many(BRAND_KEYS, tenant_id=effective_tenant_id)
    return BrandSettings(
        app_name=vals.get("app_name"),
        logo_url=vals.get("logo_url"),
        primary_color=vals.get("primary_color"),
        accent_color=vals.get("accent_color"),
    )


@router.put("/brand", response_model=BrandSettings)
async def update_brand(
    body: BrandSettings,
    tenant_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
) -> BrandSettings:
    repo = SettingRepository(db)
    tid = tenant_id or current_user.tenant_id
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        if v is not None:
            await repo.set(k, str(v), tenant_id=tid)
    await db.commit()
    repo2 = SettingRepository(db)
    vals = await repo2.get_many(BRAND_KEYS, tenant_id=tid)
    return BrandSettings(
        app_name=vals.get("app_name"),
        logo_url=vals.get("logo_url"),
        primary_color=vals.get("primary_color"),
        accent_color=vals.get("accent_color"),
    )


@router.get("/features", response_model=FeatureFlagsResponse)
async def get_features(
    tenant_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FeatureFlagsResponse:
    repo = SettingRepository(db)
    tid = tenant_id
    if current_user.role.value != "super_admin":
        tid = current_user.tenant_id
    items = await repo.list_by_prefix(FEATURE_PREFIX, tenant_id=tid)
    features = {}
    for s in items:
        key = s.key[len(FEATURE_PREFIX) :]
        features[key] = s.value.lower() in ("true", "1", "yes")
    return FeatureFlagsResponse(features=features)


@router.put("/features/{key}")
async def set_feature(
    key: str,
    enabled: bool = Query(...),
    tenant_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
) -> dict[str, bool]:
    repo = SettingRepository(db)
    tid = tenant_id or current_user.tenant_id
    full_key = f"{FEATURE_PREFIX}{key}"
    await repo.set(full_key, "true" if enabled else "false", tenant_id=tid)
    await db.commit()
    return {key: enabled}


@router.post("/backup")
async def trigger_backup(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
) -> dict:
    """Stub: backup requested. Real implementation would enqueue a job."""
    return {"status": "requested", "message": "Backup has been queued. You will be notified when it is ready."}


@router.get("/backups")
async def list_backups(
    current_user: User = Depends(require_role("admin", "super_admin")),
) -> dict:
    """Stub: list backups (empty for now)."""
    return {"items": [], "total": 0}


@router.get("/updates")
async def check_for_updates() -> dict:
    """Check GitHub for latest release tag."""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.github.com/repos/imranstein/SouqSync/releases/latest",
                timeout=5.0,
            )
            if r.status_code == 404:
                return {"update_available": False, "latest_version": None, "url": None}
            if r.status_code != 200:
                return {"update_available": False, "error": "Could not check for updates"}
            data = r.json()
            tag = data.get("tag_name")
            url = data.get("html_url")
            # Compare with current version from env or constant
            current = os.environ.get("APP_VERSION", "0.1.0")
            update_available = tag != current and tag is not None
            return {
                "update_available": update_available,
                "latest_version": tag,
                "current_version": current,
                "url": url,
            }
    except Exception as e:
        return {"update_available": False, "error": str(e)}
