"""Products CRUD endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.repositories.product_repo import ProductRepository
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)

router = APIRouter()


@router.get("", response_model=ProductListResponse)
async def list_products(
    distributor_id: uuid.UUID | None = Query(None),
    category: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> ProductListResponse:
    repo = ProductRepository(db)
    items, total = await repo.list_products(
        distributor_id=distributor_id,
        category=category,
        search=search,
        page=page,
        per_page=per_page,
    )
    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in items],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    repo = ProductRepository(db)
    product = await repo.get_product(product_id)
    if product is None:
        raise NotFoundError("Product")
    return ProductResponse.model_validate(product)


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    body: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("distributor", "admin")),
) -> ProductResponse:
    repo = ProductRepository(db)
    product = await repo.create_product(
        name=body.name,
        price=body.price,
        category=body.category,
        distributor_id=body.distributor_id,
        sku=body.sku,
    )
    await db.commit()
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    body: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("distributor", "admin")),
) -> ProductResponse:
    repo = ProductRepository(db)
    data = body.model_dump(exclude_unset=True)
    product = await repo.update_product(product_id, data)
    if product is None:
        raise NotFoundError("Product")
    await db.commit()
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("distributor", "admin")),
) -> None:
    repo = ProductRepository(db)
    deleted = await repo.delete_product(product_id)
    if not deleted:
        raise NotFoundError("Product")
    await db.commit()
