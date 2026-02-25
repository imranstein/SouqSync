"""Tenant request/response schemas."""

from __future__ import annotations

import uuid  # noqa: TC003
from datetime import datetime  # noqa: TC003

from pydantic import BaseModel, ConfigDict, Field


class TenantCreate(BaseModel):
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=64)
    locale: str = Field("en", max_length=10)
    currency_code: str = Field("ETB", max_length=6)


class TenantUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    locale: str | None = Field(None, max_length=10)
    currency_code: str | None = Field(None, max_length=6)
    is_active: bool | None = None


class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    locale: str
    currency_code: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TenantListResponse(BaseModel):
    items: list[TenantResponse]
    total: int
