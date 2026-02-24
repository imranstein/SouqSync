"""Auth endpoints — OTP request, verification, token refresh."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends

from app.api.deps import get_db
from app.core.security import create_access_token, create_refresh_token
from app.schemas.auth import (
    RefreshTokenRequest,
    RequestOTPRequest,
    RequestOTPResponse,
    TokenResponse,
    VerifyOTPRequest,
)
from app.schemas.common import ErrorResponse
from app.services.auth_service import refresh_tokens, request_otp, verify_otp

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post(
    "/auth/request-otp",
    response_model=RequestOTPResponse,
    summary="Request a one-time password",
    responses={429: {"model": ErrorResponse, "description": "Rate limit exceeded"}},
)
async def handle_request_otp(body: RequestOTPRequest) -> RequestOTPResponse:
    result = await request_otp(body.phone)
    return RequestOTPResponse(**result)


@router.post(
    "/auth/verify-otp",
    response_model=TokenResponse,
    summary="Verify OTP and receive access/refresh tokens",
    responses={401: {"model": ErrorResponse, "description": "Invalid or expired OTP"}},
)
async def handle_verify_otp(
    body: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> TokenResponse:
    user = await verify_otp(body.phone, body.code, db)
    access = create_access_token(str(user.id), extra={"role": user.role.value})
    refresh = create_refresh_token(str(user.id))
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post(
    "/auth/refresh",
    response_model=TokenResponse,
    summary="Refresh an expired access token",
    responses={401: {"model": ErrorResponse, "description": "Invalid refresh token"}},
)
async def handle_refresh(body: RefreshTokenRequest) -> TokenResponse:
    return await refresh_tokens(body.refresh_token)
