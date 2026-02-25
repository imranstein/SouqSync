"""Languages CRUD — platform-wide, super_admin or admin."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_db, require_role
from app.core.exceptions import NotFoundError
from app.repositories.language_repo import LanguageRepository
from app.schemas.language import (
    LanguageCreate,
    LanguageListResponse,
    LanguageResponse,
    LanguageUpdate,
)

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

    from app.models.user import User

router = APIRouter()


@router.get("", response_model=LanguageListResponse)
async def list_languages(
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
) -> LanguageListResponse:
    repo = LanguageRepository(db)
    items, total = await repo.list_languages(active_only=active_only)
    return LanguageListResponse(
        items=[LanguageResponse.model_validate(x) for x in items],
        total=total,
    )


@router.get("/by-code/{code}", response_model=LanguageResponse)
async def get_language_by_code(
    code: str,
    db: AsyncSession = Depends(get_db),
) -> LanguageResponse:
    repo = LanguageRepository(db)
    lang = await repo.get_by_code(code)
    if lang is None:
        raise NotFoundError("Language")
    return LanguageResponse.model_validate(lang)


@router.post("", response_model=LanguageResponse, status_code=201)
async def create_language(
    body: LanguageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
) -> LanguageResponse:
    repo = LanguageRepository(db)
    lang = await repo.create(**body.model_dump())
    await db.commit()
    return LanguageResponse.model_validate(lang)


@router.put("/{language_id}", response_model=LanguageResponse)
async def update_language(
    language_id: uuid.UUID,
    body: LanguageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
) -> LanguageResponse:
    repo = LanguageRepository(db)
    lang = await repo.get_by_id(language_id)
    if lang is None:
        raise NotFoundError("Language")
    data = body.model_dump(exclude_unset=True)
    await repo.update(lang, **data)
    await db.commit()
    return LanguageResponse.model_validate(lang)


@router.delete("/{language_id}", status_code=204)
async def delete_language(
    language_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
) -> None:
    repo = LanguageRepository(db)
    lang = await repo.get_by_id(language_id)
    if lang is None:
        raise NotFoundError("Language")
    await repo.delete(lang)
    await db.commit()
