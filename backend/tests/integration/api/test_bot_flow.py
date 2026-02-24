"""Integration tests for full Telegram bot conversation flow via webhook."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


def _make_update(update_id: int, chat_id: int, text: str) -> dict:
    return {
        "update_id": update_id,
        "message": {
            "message_id": update_id,
            "from": {"id": chat_id, "first_name": "Test"},
            "chat": {"id": chat_id, "type": "private"},
            "text": text,
        },
    }


def _make_callback(update_id: int, chat_id: int, data: str) -> dict:
    return {
        "update_id": update_id,
        "callback_query": {
            "id": str(update_id),
            "from": {"id": chat_id, "first_name": "Test"},
            "message": {
                "message_id": update_id - 1,
                "chat": {"id": chat_id, "type": "private"},
            },
            "data": data,
        },
    }


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@patch("app.services.telegram_bot._post", new_callable=AsyncMock, return_value={"ok": True})
async def test_start_sends_welcome(mock_post: AsyncMock, client: AsyncClient) -> None:
    resp = await client.post("/api/v1/webhooks/telegram", json=_make_update(1, 1001, "/start"))
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
    mock_post.assert_called()
    call_args = mock_post.call_args_list[0]
    assert call_args[0][0] == "sendMessage"
    assert "SoukSync" in call_args[0][1]["text"]


@patch("app.services.telegram_bot._post", new_callable=AsyncMock, return_value={"ok": True})
async def test_language_selection(mock_post: AsyncMock, client: AsyncClient) -> None:
    from app.services.conversation import reset_state

    reset_state(1002)
    await client.post("/api/v1/webhooks/telegram", json=_make_update(1, 1002, "/start"))
    await client.post("/api/v1/webhooks/telegram", json=_make_update(2, 1002, "1"))

    calls = mock_post.call_args_list
    lang_call = calls[-1]
    assert "ask_shop_name" in str(lang_call) or "\u12e8\u1231\u1245" in lang_call[0][1]["text"]


@patch("app.services.telegram_bot._post", new_callable=AsyncMock, return_value={"ok": True})
async def test_full_registration_flow(mock_post: AsyncMock, client: AsyncClient) -> None:
    from app.services.conversation import get_state, reset_state

    chat_id = 1003
    reset_state(chat_id)

    await client.post("/api/v1/webhooks/telegram", json=_make_update(1, chat_id, "/start"))
    await client.post("/api/v1/webhooks/telegram", json=_make_update(2, chat_id, "3"))
    await client.post("/api/v1/webhooks/telegram", json=_make_update(3, chat_id, "Test Shop"))
    await client.post("/api/v1/webhooks/telegram", json=_make_update(4, chat_id, "1"))
    await client.post("/api/v1/webhooks/telegram", json=_make_update(5, chat_id, "1"))

    from app.services.conversation import ConversationStep

    state = get_state(chat_id)
    assert state.step == ConversationStep.REGISTERED
    assert state.shop_name == "Test Shop"
    assert state.location == "Mercato"
    assert state.shop_type == "Kiosk"
    assert state.language == "en"


@patch("app.services.telegram_bot._post", new_callable=AsyncMock, return_value={"ok": True})
async def test_order_flow(mock_post: AsyncMock, client: AsyncClient) -> None:
    from app.services.conversation import ConversationStep, get_state, reset_state

    chat_id = 1004
    reset_state(chat_id)

    await client.post("/api/v1/webhooks/telegram", json=_make_update(1, chat_id, "/start"))
    await client.post("/api/v1/webhooks/telegram", json=_make_update(2, chat_id, "3"))
    await client.post("/api/v1/webhooks/telegram", json=_make_update(3, chat_id, "My Shop"))
    await client.post("/api/v1/webhooks/telegram", json=_make_update(4, chat_id, "2"))
    await client.post("/api/v1/webhooks/telegram", json=_make_update(5, chat_id, "2"))

    await client.post("/api/v1/webhooks/telegram", json=_make_update(6, chat_id, "order"))

    state = get_state(chat_id)
    assert state.step == ConversationStep.BROWSING_CATEGORIES

    await client.post("/api/v1/webhooks/telegram", json=_make_update(7, chat_id, "1"))
    assert get_state(chat_id).step == ConversationStep.BROWSING_PRODUCTS

    await client.post("/api/v1/webhooks/telegram", json=_make_update(8, chat_id, "1"))
    assert len(get_state(chat_id).cart) == 1

    await client.post("/api/v1/webhooks/telegram", json=_make_update(9, chat_id, "cart"))
    assert get_state(chat_id).step == ConversationStep.CART_REVIEW

    await client.post("/api/v1/webhooks/telegram", json=_make_update(10, chat_id, "checkout"))
    assert get_state(chat_id).step == ConversationStep.AWAITING_PAYMENT_CHOICE

    await client.post("/api/v1/webhooks/telegram", json=_make_update(11, chat_id, "1"))
    state = get_state(chat_id)
    assert state.step == ConversationStep.REGISTERED
    assert state.cart == []


@patch("app.services.telegram_bot._post", new_callable=AsyncMock, return_value={"ok": True})
async def test_help_command(mock_post: AsyncMock, client: AsyncClient) -> None:
    from app.services.conversation import ConversationStep, get_state, reset_state

    chat_id = 1005
    reset_state(chat_id)
    state = get_state(chat_id)
    state.step = ConversationStep.REGISTERED
    state.language = "en"

    await client.post("/api/v1/webhooks/telegram", json=_make_update(1, chat_id, "help"))

    calls = mock_post.call_args_list
    assert any("How can I help" in str(c) for c in calls)


@patch("app.services.telegram_bot._post", new_callable=AsyncMock, return_value={"ok": True})
async def test_callback_query_handled(mock_post: AsyncMock, client: AsyncClient) -> None:
    from app.services.conversation import ConversationStep, get_state, reset_state

    chat_id = 1006
    reset_state(chat_id)
    state = get_state(chat_id)
    state.step = ConversationStep.BROWSING_CATEGORIES
    state.language = "en"

    resp = await client.post("/api/v1/webhooks/telegram", json=_make_callback(1, chat_id, "1"))
    assert resp.status_code == 200
