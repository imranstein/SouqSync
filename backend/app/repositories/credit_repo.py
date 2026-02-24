"""Credit profile repository."""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.credit_profile import CreditProfile


class CreditRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_credit_profile(self, user_id: uuid.UUID) -> CreditProfile | None:
        stmt = select(CreditProfile).where(CreditProfile.user_id == user_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_default_profile(self, user_id: uuid.UUID) -> CreditProfile:
        profile = CreditProfile(
            user_id=user_id,
            credit_limit=Decimal("500.00"),
            current_balance=Decimal("0.00"),
        )
        self._session.add(profile)
        await self._session.flush()
        await self._session.refresh(profile)
        return profile
