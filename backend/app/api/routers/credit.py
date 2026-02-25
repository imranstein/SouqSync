"""Credit profile endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends

from app.api.deps import get_db, require_role
from app.repositories.credit_repo import CreditRepository
from app.schemas.credit import CreditLimitResponse, CreditProfileResponse

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.models.user import User

router = APIRouter()

_require_kiosk = require_role("kiosk_owner", "admin")


@router.get("/profile", response_model=CreditProfileResponse)
async def get_credit_profile(
    current_user: User = Depends(_require_kiosk),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> CreditProfileResponse:
    repo = CreditRepository(db)
    profile = await repo.get_credit_profile(current_user.id)
    if profile is None:
        profile = await repo.create_default_profile(current_user.id)
        await db.commit()
    return CreditProfileResponse.model_validate(profile)


@router.get("/limit", response_model=CreditLimitResponse)
async def get_credit_limit(
    current_user: User = Depends(_require_kiosk),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> CreditLimitResponse:
    repo = CreditRepository(db)
    profile = await repo.get_credit_profile(current_user.id)
    if profile is None:
        profile = await repo.create_default_profile(current_user.id)
        await db.commit()
    return CreditLimitResponse(
        credit_limit=profile.credit_limit,
        available_credit=profile.credit_limit - profile.current_balance,
    )
