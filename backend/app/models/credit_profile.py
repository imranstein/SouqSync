"""CreditProfile model — micro-credit tracking for kiosk owners."""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Float, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class CreditProfile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "credit_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False,
    )
    credit_limit: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=500, nullable=False,
    )
    current_balance: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=0, nullable=False,
    )
    risk_score: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False,
    )

    user: Mapped[User] = relationship(
        "User", back_populates="credit_profile", lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<CreditProfile user={self.user_id} limit={self.credit_limit}>"
