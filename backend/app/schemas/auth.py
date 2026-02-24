"""Auth-related Pydantic schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class RequestOTPRequest(BaseModel):
    phone: str = Field(..., min_length=9, max_length=20, examples=["+212612345678"])


class RequestOTPResponse(BaseModel):
    message: str
    expires_in: int = Field(..., description="OTP validity in seconds")


class VerifyOTPRequest(BaseModel):
    phone: str = Field(..., min_length=9, max_length=20, examples=["+212612345678"])
    code: str = Field(..., min_length=6, max_length=6, examples=["123456"])


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str
