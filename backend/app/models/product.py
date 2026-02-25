"""Product model — items sold by distributors."""

from __future__ import annotations

import uuid  # noqa: TC003
from decimal import Decimal  # noqa: TC003
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.order import OrderItem
    from app.models.user import User


class Product(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True,
    )
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False,
    )
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    distributor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False,
    )

    distributor: Mapped[User] = relationship(
        "User", back_populates="products", lazy="selectin",
    )
    order_items: Mapped[list[OrderItem]] = relationship(
        "OrderItem", back_populates="product", lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Product {self.name} sku={self.sku}>"
