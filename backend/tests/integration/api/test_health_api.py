"""Tests for health check endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_returns_200(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "SoukSync"
    assert data["status"] in ("ok", "degraded")
    assert "database" in data
    assert "redis" in data


@pytest.mark.asyncio
async def test_health_contains_all_fields(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    data = response.json()
    expected_fields = {"status", "app", "database", "redis"}
    assert expected_fields == set(data.keys())


@pytest.mark.asyncio
async def test_readiness_returns_200(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}
