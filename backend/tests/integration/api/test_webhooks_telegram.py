"""Integration tests for Telegram webhook endpoint."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_telegram_webhook_returns_200(client: AsyncClient) -> None:
    payload = {
        "update_id": 123456789,
        "message": {
            "message_id": 1,
            "from": {"id": 111, "first_name": "Test"},
            "chat": {"id": 111, "type": "private"},
            "text": "Hello",
        },
    }
    response = await client.post("/api/v1/webhooks/telegram", json=payload)
    assert response.status_code == 200
    assert response.json() == {"ok": True}


@pytest.mark.asyncio
async def test_telegram_webhook_empty_body_returns_200(client: AsyncClient) -> None:
    response = await client.post("/api/v1/webhooks/telegram", json={})
    assert response.status_code == 200
    assert response.json() == {"ok": True}
