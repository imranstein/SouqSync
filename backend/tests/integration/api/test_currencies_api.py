"""Integration tests for Currencies API (HTTP layer with app client)."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from app.api.deps import get_db
from app.main import app
from httpx import AsyncClient


@pytest.fixture
async def client():
    from httpx import ASGITransport

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture(autouse=True)
def _reset_overrides():
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_currencies_returns_200_and_shape(client: AsyncClient) -> None:
    mock_db = AsyncMock()

    async def _fake_db():
        yield mock_db

    app.dependency_overrides[get_db] = _fake_db

    with patch(
        "app.repositories.currency_repo.CurrencyRepository.list_currencies",
        new_callable=AsyncMock,
    ) as mock_list:
        mock_list.return_value = ([], 0)
        response = await client.get("/api/v1/currencies")

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_currencies_active_only_query(client: AsyncClient) -> None:
    mock_db = AsyncMock()

    async def _fake_db():
        yield mock_db

    app.dependency_overrides[get_db] = _fake_db

    with patch(
        "app.repositories.currency_repo.CurrencyRepository.list_currencies",
        new_callable=AsyncMock,
    ) as mock_list:
        mock_list.return_value = ([], 0)
        await client.get("/api/v1/currencies?active_only=false")

    mock_list.assert_called_once_with(active_only=False)
