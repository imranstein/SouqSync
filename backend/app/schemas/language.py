"""Language request/response schemas."""

from __future__ import annotations

import uuid  # noqa: TC003
from datetime import datetime  # noqa: TC003

from pydantic import BaseModel, ConfigDict, Field


class LanguageCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=10)
    name: str = Field(..., max_length=100)
    native_name: str = Field(..., max_length=100)
    is_rtl: bool = False
    is_default: bool = False
    sort_order: int = 0


class LanguageUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    native_name: str | None = Field(None, max_length=100)
    is_rtl: bool | None = None
    is_default: bool | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class LanguageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    name: str
    native_name: str
    is_rtl: bool
    is_default: bool
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class LanguageListResponse(BaseModel):
    items: list[LanguageResponse]
    total: int
