"""Shared Pydantic schemas."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    app: str
    database: str
    redis: str


class ErrorResponse(BaseModel):
    detail: str
