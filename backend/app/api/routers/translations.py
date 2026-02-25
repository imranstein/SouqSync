"""Translations CRUD and get-by-namespace (tenant-aware)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user, get_db, require_role
from app.core.exceptions import NotFoundError
from app.repositories.language_repo import LanguageRepository
from app.repositories.translation_repo import TranslationRepository
from app.schemas.translation import (
    TranslationCreate,
    TranslationListResponse,
    TranslationMapResponse,
    TranslationResponse,
    TranslationUpdate,
)

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

    from app.models.user import User

router = APIRouter()


@router.get("/map", response_model=TranslationMapResponse)
async def get_translations_map(
    language_code: str = Query(..., description="e.g. en, am"),
    namespace: str = Query(..., description="e.g. common, dashboard"),
    tenant_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TranslationMapResponse:
    lang_repo = LanguageRepository(db)
    lang = await lang_repo.get_by_code(language_code)
    if lang is None:
        raise NotFoundError("Language")
    effective_tenant_id = tenant_id
    if current_user.role.value != "super_admin":
        effective_tenant_id = current_user.tenant_id
    tr_repo = TranslationRepository(db)
    trans = await tr_repo.get_map(language_id=lang.id, tenant_id=effective_tenant_id, namespace=namespace)
    return TranslationMapResponse(namespace=namespace, translations=trans)


@router.get("", response_model=TranslationListResponse)
async def list_translations(
    language_id: uuid.UUID | None = Query(None),
    tenant_id: uuid.UUID | None = Query(None),
    namespace: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
) -> TranslationListResponse:
    tr_repo = TranslationRepository(db)
    effective_tenant_id = tenant_id
    if current_user.role.value != "super_admin":
        # Admins are tenant-bound; they can't read other tenants or global platform strings.
        effective_tenant_id = current_user.tenant_id
    items, total = await tr_repo.list_translations(
        language_id=language_id,
        tenant_id=effective_tenant_id,
        namespace=namespace,
        page=page,
        per_page=per_page,
    )
    return TranslationListResponse(
        items=[TranslationResponse.model_validate(x) for x in items],
        total=total,
    )


@router.post("", response_model=TranslationResponse, status_code=201)
async def create_translation(
    body: TranslationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
) -> TranslationResponse:
    tr_repo = TranslationRepository(db)
    data = body.model_dump()
    if current_user.role.value != "super_admin":
        data["tenant_id"] = current_user.tenant_id
    tr = await tr_repo.create(**data)
    await db.commit()
    return TranslationResponse.model_validate(tr)


@router.put("/{translation_id}", response_model=TranslationResponse)
async def update_translation(
    translation_id: uuid.UUID,
    body: TranslationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
) -> TranslationResponse:
    tr_repo = TranslationRepository(db)
    tr = await tr_repo.get_by_id(translation_id)
    if tr is None:
        raise NotFoundError("Translation")
    if (
        current_user.role.value != "super_admin"
        and (current_user.tenant_id is None or tr.tenant_id != current_user.tenant_id)
    ):
        raise NotFoundError("Translation")
    await tr_repo.update(tr, body.value)
    await db.commit()
    return TranslationResponse.model_validate(tr)


@router.delete("/{translation_id}", status_code=204)
async def delete_translation(
    translation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
) -> None:
    tr_repo = TranslationRepository(db)
    tr = await tr_repo.get_by_id(translation_id)
    if tr is None:
        raise NotFoundError("Translation")
    await tr_repo.delete(tr)
    await db.commit()
