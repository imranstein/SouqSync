"""Setting (brand, feature flags) request/response schemas."""

from __future__ import annotations

import uuid  # noqa: TC003
from datetime import datetime  # noqa: TC003

from pydantic import BaseModel, ConfigDict, Field


class SettingCreate(BaseModel):
    key: str = Field(..., max_length=128)
    value: str = Field(..., min_length=1)
    tenant_id: uuid.UUID | None = None


class SettingUpdate(BaseModel):
    value: str = Field(..., min_length=1)


class SettingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID | None
    key: str
    value: str
    created_at: datetime
    updated_at: datetime


class SettingListResponse(BaseModel):
    items: list[SettingResponse]
    total: int


class BrandSettings(BaseModel):
    """Brand settings for a tenant (convenience shape)."""
    app_name: str | None = None
    logo_url: str | None = None
    primary_color: str | None = None
    accent_color: str | None = None


class FeatureFlagsResponse(BaseModel):
    """Feature flags as key -> enabled."""
    features: dict[str, bool]
