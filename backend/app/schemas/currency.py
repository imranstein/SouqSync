"""Currency request/response schemas."""

from __future__ import annotations

import uuid  # noqa: TC003
from datetime import datetime  # noqa: TC003

from pydantic import BaseModel, ConfigDict, Field


class CurrencyCreate(BaseModel):
    code: str = Field(..., max_length=10)
    name: str = Field(..., max_length=100)
    symbol: str = Field(..., max_length=10)
    decimal_places: int = Field(2, ge=0, le=4)
    is_default: bool = False


class CurrencyUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    symbol: str | None = Field(None, max_length=10)
    decimal_places: int | None = Field(None, ge=0, le=4)
    is_default: bool | None = None
    is_active: bool | None = None


class CurrencyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    name: str
    symbol: str
    decimal_places: int
    is_default: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CurrencyListResponse(BaseModel):
    items: list[CurrencyResponse]
    total: int
