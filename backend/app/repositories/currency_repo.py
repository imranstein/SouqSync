"""Currency repository — CRUD and list."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TCH002

from app.models.currency import Currency

if TYPE_CHECKING:
    import uuid


class CurrencyRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_currencies(
        self,
        *,
        active_only: bool = True,
    ) -> tuple[list[Currency], int]:
        base = select(Currency)
        if active_only:
            base = base.where(Currency.is_active.is_(True))
        base = base.order_by(Currency.code)
        count_stmt = select(func.count()).select_from(base.subquery())
        total: int = (await self._session.execute(count_stmt)).scalar_one()
        result = await self._session.execute(base)
        return list(result.scalars().all()), total

    async def get_by_id(self, currency_id: uuid.UUID) -> Currency | None:
        return await self._session.get(Currency, currency_id)

    async def get_by_code(self, code: str) -> Currency | None:
        stmt = select(Currency).where(Currency.code == code)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Currency:
        c = Currency(**kwargs)
        self._session.add(c)
        await self._session.flush()
        await self._session.refresh(c)
        return c

    async def update(self, c: Currency, **kwargs) -> Currency:
        for k, v in kwargs.items():
            if hasattr(c, k):
                setattr(c, k, v)
        await self._session.flush()
        await self._session.refresh(c)
        return c

    async def delete(self, c: Currency) -> None:
        await self._session.delete(c)
        await self._session.flush()
