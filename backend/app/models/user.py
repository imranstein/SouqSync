"""User model — kiosk owners, distributors, and admins."""

from __future__ import annotations

import enum
import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import BigInteger, Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.credit_profile import CreditProfile
    from app.models.order import Order
    from app.models.product import Product


class UserRole(str, enum.Enum):
    KIOSK_OWNER = "kiosk_owner"
    DISTRIBUTOR = "distributor"
    ADMIN = "admin"


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    phone: Mapped[str] = mapped_column(
        String(20), unique=True, index=True, nullable=False,
    )
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=False),
        default=UserRole.KIOSK_OWNER,
        nullable=False,
    )
    language_pref: Mapped[str] = mapped_column(
        String(10), default="am", nullable=False,
    )
    telegram_chat_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, unique=True, nullable=True,
    )
    distributor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id"), nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False,
    )

    # Self-referential: kiosk_owner → distributor
    distributor: Mapped[Optional[User]] = relationship(
        "User",
        remote_side="User.id",
        back_populates="kiosk_owners",
        lazy="selectin",
    )
    kiosk_owners: Mapped[List[User]] = relationship(
        "User",
        back_populates="distributor",
        lazy="selectin",
    )

    products: Mapped[List[Product]] = relationship(
        "Product", back_populates="distributor", lazy="selectin",
    )
    orders: Mapped[List[Order]] = relationship(
        "Order",
        foreign_keys="Order.user_id",
        back_populates="user",
        lazy="selectin",
    )
    distributed_orders: Mapped[List[Order]] = relationship(
        "Order",
        foreign_keys="Order.distributor_id",
        back_populates="distributor",
        lazy="selectin",
    )
    credit_profile: Mapped[Optional[CreditProfile]] = relationship(
        "CreditProfile", back_populates="user", uselist=False, lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<User {self.phone} role={self.role.value}>"
