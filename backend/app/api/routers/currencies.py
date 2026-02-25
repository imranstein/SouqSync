"""Currencies CRUD — platform-wide."""

from __future__ import annotations

import uuid  # noqa: TC003

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TCH002

from app.api.deps import get_db, require_role
from app.core.exceptions import NotFoundError
from app.models.user import User  # noqa: TCH001
from app.repositories.currency_repo import CurrencyRepository
from app.schemas.currency import (
    CurrencyCreate,
    CurrencyListResponse,
    CurrencyResponse,
    CurrencyUpdate,
)

router = APIRouter()


@router.get("", response_model=CurrencyListResponse)
async def list_currencies(
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> CurrencyListResponse:
    repo = CurrencyRepository(db)
    items, total = await repo.list_currencies(active_only=active_only)
    return CurrencyListResponse(
        items=[CurrencyResponse.model_validate(x) for x in items],
        total=total,
    )


@router.post("", response_model=CurrencyResponse, status_code=201)
async def create_currency(
    body: CurrencyCreate,
    db: AsyncSession = Depends(get_db),  # noqa: B008
    current_user: User = Depends(require_role("admin", "super_admin")),  # noqa: B008
) -> CurrencyResponse:
    repo = CurrencyRepository(db)
    c = await repo.create(**body.model_dump())
    await db.commit()
    return CurrencyResponse.model_validate(c)


@router.put("/{currency_id}", response_model=CurrencyResponse)
async def update_currency(
    currency_id: uuid.UUID,
    body: CurrencyUpdate,
    db: AsyncSession = Depends(get_db),  # noqa: B008
    current_user: User = Depends(require_role("admin", "super_admin")),  # noqa: B008
) -> CurrencyResponse:
    repo = CurrencyRepository(db)
    c = await repo.get_by_id(currency_id)
    if c is None:
        raise NotFoundError("Currency")
    data = body.model_dump(exclude_unset=True)
    await repo.update(c, **data)
    await db.commit()
    return CurrencyResponse.model_validate(c)


@router.delete("/{currency_id}", status_code=204)
async def delete_currency(
    currency_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),  # noqa: B008
    current_user: User = Depends(require_role("super_admin")),  # noqa: B008
) -> None:
    repo = CurrencyRepository(db)
    c = await repo.get_by_id(currency_id)
    if c is None:
        raise NotFoundError("Currency")
    await repo.delete(c)
    await db.commit()
