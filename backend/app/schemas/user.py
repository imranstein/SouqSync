"""User request/response schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

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
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    name: str | None = None
    language_pref: str | None = None
