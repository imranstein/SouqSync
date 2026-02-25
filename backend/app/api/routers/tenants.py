"""Tenants CRUD — super_admin only for platform."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.api.deps import get_db, require_role
from app.core.exceptions import NotFoundError
from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate, TenantListResponse, TenantResponse, TenantUpdate

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

    from app.models.user import User

router = APIRouter()


@router.get("", response_model=TenantListResponse)
async def list_tenants(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
) -> TenantListResponse:
    stmt = select(Tenant).order_by(Tenant.slug)
    result = await db.execute(stmt)
    items = list(result.scalars().all())
    return TenantListResponse(items=[TenantResponse.model_validate(x) for x in items], total=len(items))


@router.post("", response_model=TenantResponse, status_code=201)
async def create_tenant(
    body: TenantCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
) -> TenantResponse:
    tenant = Tenant(**body.model_dump())
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return TenantResponse.model_validate(tenant)


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: uuid.UUID,
    body: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
) -> TenantResponse:
    tenant = await db.get(Tenant, tenant_id)
    if tenant is None:
        raise NotFoundError("Tenant")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(tenant, k, v)
    await db.commit()
    await db.refresh(tenant)
    return TenantResponse.model_validate(tenant)
