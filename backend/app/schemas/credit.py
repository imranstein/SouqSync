"""Credit profile request/response schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, computed_field


class CreditProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    credit_limit: Decimal
    current_balance: Decimal
    risk_score: float | None
    is_active: bool
    created_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def available_credit(self) -> Decimal:
        return self.credit_limit - self.current_balance


class CreditLimitResponse(BaseModel):
    credit_limit: Decimal
    available_credit: Decimal
