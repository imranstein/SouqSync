"""User model — kiosk owners, distributors, and admins."""

from __future__ import annotations

import enum
import uuid  # noqa: TC003
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.credit_profile import CreditProfile
    from app.models.order import Order
    from app.models.product import Product
    from app.models.tenant import Tenant


class UserRole(str, enum.Enum):
    KIOSK_OWNER = "kiosk_owner"
    DISTRIBUTOR = "distributor"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    phone: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False,
    )
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=False),
        default=UserRole.KIOSK_OWNER,
        nullable=False,
    )
    language_pref: Mapped[str] = mapped_column(
        String(10),
        default="am",
        nullable=False,
    )
    telegram_chat_id: Mapped[int | None] = mapped_column(
        BigInteger,
        unique=True,
        nullable=True,
    )
    distributor_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tenants.id"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Self-referential: kiosk_owner → distributor
    distributor: Mapped[User | None] = relationship(
        "User",
        remote_side="User.id",
        back_populates="kiosk_owners",
        lazy="selectin",
    )
    kiosk_owners: Mapped[list[User]] = relationship(
        "User",
        back_populates="distributor",
        lazy="selectin",
    )

    products: Mapped[list[Product]] = relationship(
        "Product",
        back_populates="distributor",
        lazy="selectin",
    )
    orders: Mapped[list[Order]] = relationship(
        "Order",
        foreign_keys="Order.user_id",
        back_populates="user",
        lazy="selectin",
    )
    distributed_orders: Mapped[list[Order]] = relationship(
        "Order",
        foreign_keys="Order.distributor_id",
        back_populates="distributor",
        lazy="selectin",
    )
    credit_profile: Mapped[CreditProfile | None] = relationship(
        "CreditProfile",
        back_populates="user",
        uselist=False,
        lazy="selectin",
    )
    tenant: Mapped[Tenant | None] = relationship(
        "Tenant",
        back_populates="users",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<User {self.phone} role={self.role.value}>"
