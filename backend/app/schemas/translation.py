"""Translation request/response schemas."""

from __future__ import annotations

import uuid  # noqa: TC003
from datetime import datetime  # noqa: TC003

from pydantic import BaseModel, ConfigDict, Field


class TranslationCreate(BaseModel):
    language_id: uuid.UUID
    tenant_id: uuid.UUID | None = None
    namespace: str = Field(..., max_length=64)
    key: str = Field(..., max_length=255)
    value: str = Field(..., min_length=1)


class TranslationUpdate(BaseModel):
    value: str = Field(..., min_length=1)


class TranslationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    language_id: uuid.UUID
    tenant_id: uuid.UUID | None
    namespace: str
    key: str
    value: str
    created_at: datetime
    updated_at: datetime


class TranslationListResponse(BaseModel):
    items: list[TranslationResponse]
    total: int


class TranslationMapResponse(BaseModel):
    """Namespace key-value map for a language (tenant-aware)."""
    namespace: str
    translations: dict[str, str]
