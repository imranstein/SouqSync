"""Language repository — CRUD and list."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import func, select

from app.models.language import Language

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession


class LanguageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_languages(
        self,
        *,
        active_only: bool = True,
    ) -> tuple[list[Language], int]:
        base = select(Language)
        count_stmt = select(func.count()).select_from(Language)
        if active_only:
            base = base.where(Language.is_active.is_(True))
            count_stmt = count_stmt.where(Language.is_active.is_(True))
        base = base.order_by(Language.sort_order, Language.code)

        # ⚡ Bolt: Use direct count query instead of subquery for better performance
        total: int = (await self._session.execute(count_stmt)).scalar_one()
        result = await self._session.execute(base)
        return list(result.scalars().all()), total

    async def get_by_id(self, language_id: uuid.UUID) -> Language | None:
        return await self._session.get(Language, language_id)

    async def get_by_code(self, code: str) -> Language | None:
        stmt = select(Language).where(Language.code == code)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Language:
        lang = Language(**kwargs)
        self._session.add(lang)
        await self._session.flush()
        await self._session.refresh(lang)
        return lang

    async def update(self, lang: Language, **kwargs) -> Language:
        for k, v in kwargs.items():
            if hasattr(lang, k):
                setattr(lang, k, v)
        await self._session.flush()
        await self._session.refresh(lang)
        return lang

    async def delete(self, lang: Language) -> None:
        await self._session.delete(lang)
        await self._session.flush()
