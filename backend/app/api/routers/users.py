"""User endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select

from app.api.deps import get_current_user, get_db, require_role
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.schemas.user import UserAdminCreate, UserAdminUpdate, UserResponse, UserUpdate

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("", response_model=list[UserResponse])
async def list_users(
    tenant_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
) -> list[UserResponse]:
    stmt = select(User).order_by(User.created_at.desc())
    if tenant_id:
        stmt = stmt.where(User.tenant_id == tenant_id)
    elif current_user.tenant_id and current_user.role.value != "super_admin":
        stmt = stmt.where(User.tenant_id == current_user.tenant_id)
    result = await db.execute(stmt)
    users = list(result.scalars().all())
    return [UserResponse.model_validate(u) for u in users]


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserAdminCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
) -> UserResponse:
    data = body.model_dump()

    # Tight tenant rules:
    # - admin can only create users under their tenant
    # - super_admin may specify tenant_id (or leave null)
    if current_user.role.value != "super_admin":
        data["tenant_id"] = current_user.tenant_id

    user = User(**data)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.put("/by-id/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    body: UserAdminUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
) -> UserResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise NotFoundError("User")

    data = body.model_dump(exclude_unset=True)

    if current_user.role.value != "super_admin":
        # Admin is tenant-bound and can't move users across tenants.
        data.pop("tenant_id", None)

        # Admin can only update users within their tenant.
        if current_user.tenant_id and user.tenant_id != current_user.tenant_id:
            raise NotFoundError("User")

    for field, value in data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),  # noqa: B008
) -> User:
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> User:
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user
