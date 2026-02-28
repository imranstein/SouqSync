"""Order repository — async CRUD with status transitions."""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError, ValidationError
from app.models.order import VALID_TRANSITIONS, Order, OrderItem, OrderStatus

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

    from app.models.product import Product
    from app.schemas.order import OrderCreate


class OrderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_order(
        self,
        user_id: uuid.UUID,
        data: OrderCreate,
        products: dict[uuid.UUID, Product],
    ) -> Order:
        total = Decimal("0.00")
        items: list[OrderItem] = []

        for item_data in data.items:
            product = products[item_data.product_id]
            line_total = product.price * item_data.quantity
            total += line_total
            items.append(
                OrderItem(
                    product_id=item_data.product_id,
                    quantity=item_data.quantity,
                    unit_price=product.price,
                )
            )

        order = Order(
            user_id=user_id,
            distributor_id=data.distributor_id,
            status=OrderStatus.PENDING,
            total=total,
            notes=data.notes,
            items=items,
        )
        self._session.add(order)
        await self._session.flush()
        await self._session.refresh(order)
        return order

    async def list_orders(
        self,
        *,
        user_id: uuid.UUID | None = None,
        distributor_id: uuid.UUID | None = None,
        status: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Order], int]:
        base = select(Order).options(
            selectinload(Order.items).selectinload(OrderItem.product),
        )
        count_q = select(func.count()).select_from(Order)

        if user_id is not None:
            base = base.where(Order.user_id == user_id)
            count_q = count_q.where(Order.user_id == user_id)
        if distributor_id is not None:
            base = base.where(Order.distributor_id == distributor_id)
            count_q = count_q.where(Order.distributor_id == distributor_id)
        if status is not None:
            base = base.where(Order.status == status)
            count_q = count_q.where(Order.status == status)

        # ⚡ Bolt: Use direct count query instead of subquery for better performance
        total: int = (await self._session.execute(count_q)).scalar_one()

        offset = (page - 1) * per_page
        rows_stmt = base.order_by(Order.created_at.desc()).offset(offset).limit(per_page)
        rows = (await self._session.execute(rows_stmt)).scalars().unique().all()

        return list(rows), total

    async def get_order(self, order_id: uuid.UUID) -> Order | None:
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product),
            )
            .where(Order.id == order_id)
        )
        result = await self._session.execute(stmt)
        return result.scalars().first()

    async def update_order_status(self, order_id: uuid.UUID, new_status: str) -> Order:
        order = await self.get_order(order_id)
        if order is None:
            raise NotFoundError("Order")

        try:
            target = OrderStatus(new_status)
        except ValueError as err:
            raise ValidationError(f"Invalid status: {new_status}") from err

        allowed = VALID_TRANSITIONS.get(order.status.value, set())
        if target.value not in allowed:
            raise ValidationError(f"Cannot transition from {order.status.value} to {target.value}")

        order.status = target
        await self._session.flush()
        await self._session.refresh(order)
        return order
