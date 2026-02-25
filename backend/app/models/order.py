"""Order and OrderItem models."""

from __future__ import annotations

import datetime  # noqa: TC003
import enum
import uuid  # noqa: TC003
from decimal import Decimal  # noqa: TC003
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


VALID_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"shipped", "cancelled"},
    "shipped": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "orders"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False,
    )
    distributor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False,
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status", native_enum=False),
        default=OrderStatus.PENDING,
        nullable=False,
    )
    total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False,
    )
    delivery_fee: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=0, nullable=False,
    )
    payment_method: Mapped[str | None] = mapped_column(
        String(50), nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(
        String(1000), nullable=True,
    )

    user: Mapped[User] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="orders",
        lazy="selectin",
    )
    distributor: Mapped[User] = relationship(
        "User",
        foreign_keys=[distributor_id],
        back_populates="distributed_orders",
        lazy="selectin",
    )
    items: Mapped[list[OrderItem]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Order {self.id} status={self.status}>"


class OrderItem(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id"), nullable=False,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False,
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    order: Mapped[Order] = relationship(
        "Order", back_populates="items", lazy="selectin",
    )
    product: Mapped[Product] = relationship(
        "Product", back_populates="order_items", lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<OrderItem product={self.product_id} qty={self.quantity}>"
