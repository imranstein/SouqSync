"""Auth-related Pydantic schemas."""

from __future__ import annotations

import re

from pydantic import BaseModel, Field, field_validator


class RequestOTPRequest(BaseModel):
    phone: str = Field(..., min_length=9, max_length=20, examples=["+212612345678"])

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^\+\d{7,19}$", v):
            raise ValueError("Phone number must be in international format (e.g., +251...)")
        return v


class RequestOTPResponse(BaseModel):
    message: str
    expires_in: int = Field(..., description="OTP validity in seconds")


class VerifyOTPRequest(BaseModel):
    phone: str = Field(..., min_length=9, max_length=20, examples=["+212612345678"])
    code: str = Field(..., min_length=6, max_length=6, examples=["123456"])

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^\+\d{7,19}$", v):
            raise ValueError("Phone number must be in international format (e.g., +251...)")
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str
