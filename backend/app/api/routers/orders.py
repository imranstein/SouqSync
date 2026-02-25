"""Orders API endpoints."""

from __future__ import annotations

import uuid  # noqa: TC003
from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundError, ValidationError
from app.repositories.order_repo import OrderRepository
from app.repositories.product_repo import ProductRepository
from app.schemas.order import (
    OrderCreate,
    OrderItemResponse,
    OrderListResponse,
    OrderResponse,
    OrderStatusUpdate,
)

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.models.user import User

router = APIRouter()


def _order_to_response(order) -> OrderResponse:
    """Map an Order ORM instance to OrderResponse, resolving product_name."""
    items = []
    for oi in order.items:
        product_name = oi.product.name if oi.product else None
        items.append(
            OrderItemResponse(
                id=oi.id,
                product_id=oi.product_id,
                product_name=product_name,
                quantity=oi.quantity,
                unit_price=oi.unit_price,
            )
        )
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        distributor_id=order.distributor_id,
        status=order.status.value if hasattr(order.status, "value") else order.status,
        total=order.total,
        delivery_fee=order.delivery_fee,
        payment_method=order.payment_method,
        items=items,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderResponse:
    product_repo = ProductRepository(db)

    products = {}
    for item in body.items:
        product = await product_repo.get_product(item.product_id)
        if product is None or not product.is_active:
            raise ValidationError(f"Product {item.product_id} not found or inactive")
        products[item.product_id] = product

    order_repo = OrderRepository(db)
    order = await order_repo.create_order(
        user_id=current_user.id, data=body, products=products
    )
    await db.commit()
    await db.refresh(order)
    return _order_to_response(order)


@router.get("", response_model=OrderListResponse)
async def list_orders(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderListResponse:
    repo = OrderRepository(db)

    kwargs: dict = {"status": status, "page": page, "per_page": per_page}
    if current_user.role.value == "admin":
        pass
    elif current_user.role.value == "distributor":
        kwargs["distributor_id"] = current_user.id
    else:
        kwargs["user_id"] = current_user.id

    items, total = await repo.list_orders(**kwargs)
    return OrderListResponse(
        items=[_order_to_response(o) for o in items],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderResponse:
    repo = OrderRepository(db)
    order = await repo.get_order(order_id)
    if order is None:
        raise NotFoundError("Order")
    return _order_to_response(order)


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: uuid.UUID,
    body: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderResponse:
    repo = OrderRepository(db)
    order = await repo.update_order_status(order_id, body.status)
    await db.commit()
    return _order_to_response(order)
