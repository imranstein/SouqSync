"""Generic base repository with CRUD operations."""

from __future__ import annotations

from typing import TYPE_CHECKING, Generic, TypeVar

from sqlalchemy import select

from app.models.base import Base

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType], session: AsyncSession) -> None:
        self._model = model
        self._session = session

    async def get_by_id(self, id_: int) -> ModelType | None:
        return await self._session.get(self._model, id_)

    async def get_all(self, *, offset: int = 0, limit: int = 100) -> list[ModelType]:
        stmt = select(self._model).offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, obj: ModelType) -> ModelType:
        self._session.add(obj)
        await self._session.flush()
        await self._session.refresh(obj)
        return obj

    async def delete(self, obj: ModelType) -> None:
        await self._session.delete(obj)
        await self._session.flush()
