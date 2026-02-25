"""User request/response schemas."""

from __future__ import annotations

import uuid  # noqa: TC003
from datetime import datetime  # noqa: TC003

from pydantic import BaseModel, ConfigDict

from app.models.user import UserRole


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    phone: str
    name: str | None
    role: UserRole
    language_pref: str
    telegram_chat_id: int | None
    distributor_id: uuid.UUID | None
    tenant_id: uuid.UUID | None
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    name: str | None = None
    language_pref: str | None = None


class UserAdminCreate(BaseModel):
    phone: str
    name: str | None = None
    role: UserRole = UserRole.KIOSK_OWNER
    language_pref: str = "am"
    telegram_chat_id: int | None = None
    distributor_id: uuid.UUID | None = None
    tenant_id: uuid.UUID | None = None
    is_active: bool = True


class UserAdminUpdate(BaseModel):
    name: str | None = None
    role: UserRole | None = None
    language_pref: str | None = None
    telegram_chat_id: int | None = None
    distributor_id: uuid.UUID | None = None
    tenant_id: uuid.UUID | None = None
    is_active: bool | None = None
