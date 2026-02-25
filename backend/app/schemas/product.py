"""Product request/response schemas."""

from __future__ import annotations

import uuid  # noqa: TC003
from datetime import datetime  # noqa: TC003
from decimal import Decimal  # noqa: TC003

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    price: Decimal = Field(..., gt=0, decimal_places=2)
    category: str | None = Field(None, max_length=50)
    sku: str | None = Field(None, max_length=50)
    distributor_id: uuid.UUID


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    price: Decimal | None = Field(None, gt=0, decimal_places=2)
    category: str | None = Field(None, max_length=50)
    sku: str | None = Field(None, max_length=50)


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    sku: str | None
    price: Decimal
    category: str | None
    distributor_id: uuid.UUID
    is_active: bool
    created_at: datetime


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    per_page: int
