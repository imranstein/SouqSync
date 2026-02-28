"""Translation repository — CRUD and get by namespace."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import func, select

from app.models.translation import Translation

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession


class TranslationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_map(
        self,
        *,
        language_id: uuid.UUID,
        tenant_id: uuid.UUID | None,
        namespace: str,
    ) -> dict[str, str]:
        """Platform-wide first, then tenant overrides. tenant_id=None means platform only."""
        # Platform-wide (tenant_id IS NULL)
        stmt_platform = select(Translation.key, Translation.value).where(
            Translation.language_id == language_id,
            Translation.namespace == namespace,
            Translation.tenant_id.is_(None),
        )
        result = await self._session.execute(stmt_platform)
        out = {row[0]: row[1] for row in result.all()}
        # Tenant overrides (if tenant_id provided)
        if tenant_id is not None:
            stmt_tenant = select(Translation.key, Translation.value).where(
                Translation.language_id == language_id,
                Translation.tenant_id == tenant_id,
                Translation.namespace == namespace,
            )
            result_tenant = await self._session.execute(stmt_tenant)
            for row in result_tenant.all():
                out[row[0]] = row[1]
        return out

    async def list_translations(
        self,
        *,
        language_id: uuid.UUID | None = None,
        tenant_id: uuid.UUID | None = None,
        namespace: str | None = None,
        page: int = 1,
        per_page: int = 50,
    ) -> tuple[list[Translation], int]:
        base = select(Translation)
        count_stmt = select(func.count()).select_from(Translation)
        if language_id is not None:
            base = base.where(Translation.language_id == language_id)
            count_stmt = count_stmt.where(Translation.language_id == language_id)
        if tenant_id is not None:
            base = base.where(Translation.tenant_id == tenant_id)
            count_stmt = count_stmt.where(Translation.tenant_id == tenant_id)
        if namespace is not None:
            base = base.where(Translation.namespace == namespace)
            count_stmt = count_stmt.where(Translation.namespace == namespace)

        # ⚡ Bolt: Use direct count query instead of subquery for better performance
        total: int = (await self._session.execute(count_stmt)).scalar_one()

        base = base.order_by(Translation.namespace, Translation.key).offset((page - 1) * per_page).limit(per_page)
        result = await self._session.execute(base)
        return list(result.scalars().all()), total

    async def get_by_id(self, translation_id: uuid.UUID) -> Translation | None:
        return await self._session.get(Translation, translation_id)

    async def create(self, **kwargs) -> Translation:
        tr = Translation(**kwargs)
        self._session.add(tr)
        await self._session.flush()
        await self._session.refresh(tr)
        return tr

    async def update(self, tr: Translation, value: str) -> Translation:
        tr.value = value
        await self._session.flush()
        await self._session.refresh(tr)
        return tr

    async def delete(self, tr: Translation) -> None:
        await self._session.delete(tr)
        await self._session.flush()
