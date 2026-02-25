"""Setting repository — key/value per tenant."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import select

from app.models.setting import Setting

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession


class SettingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, key: str, tenant_id: uuid.UUID | None = None) -> Setting | None:
        stmt = select(Setting).where(
            Setting.key == key,
            (Setting.tenant_id == tenant_id) if tenant_id else Setting.tenant_id.is_(None),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def set(self, key: str, value: str, tenant_id: uuid.UUID | None = None) -> Setting:
        existing = await self.get(key, tenant_id)
        if existing:
            existing.value = value
            await self._session.flush()
            await self._session.refresh(existing)
            return existing
        s = Setting(key=key, value=value, tenant_id=tenant_id)
        self._session.add(s)
        await self._session.flush()
        await self._session.refresh(s)
        return s

    async def get_many(self, keys: list[str], tenant_id: uuid.UUID | None = None) -> dict[str, str]:
        stmt = select(Setting).where(Setting.key.in_(keys))
        if tenant_id is not None:
            stmt = stmt.where(Setting.tenant_id == tenant_id)
        else:
            stmt = stmt.where(Setting.tenant_id.is_(None))
        result = await self._session.execute(stmt)
        return {row.key: row.value for row in result.scalars().all()}

    async def list_by_prefix(self, prefix: str, tenant_id: uuid.UUID | None = None) -> list[Setting]:
        stmt = select(Setting).where(Setting.key.like(f"{prefix}%"))
        if tenant_id is not None:
            stmt = stmt.where(Setting.tenant_id == tenant_id)
        else:
            stmt = stmt.where(Setting.tenant_id.is_(None))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
