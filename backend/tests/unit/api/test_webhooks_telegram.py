"""Unit tests for Telegram webhook parsing."""

from __future__ import annotations

import pytest

from app.api.routers.webhooks import _parse_telegram_update


def test_parse_telegram_update_message() -> None:
    body = {
        "update_id": 123456789,
        "message": {
            "message_id": 1,
            "from": {"id": 987654321, "first_name": "Fatima"},
            "chat": {"id": 987654321, "type": "private"},
            "text": "Hello",
        },
    }
    parsed = _parse_telegram_update(body)
    assert parsed is not None
    assert parsed["update_id"] == 123456789
    assert parsed["chat_id"] == 987654321
    assert parsed["text"] == "Hello"
    assert parsed["callback_data"] is None


def test_parse_telegram_update_callback_query() -> None:
    body = {
        "update_id": 123456790,
        "callback_query": {
            "id": "cq1",
            "from": {"id": 987654321},
            "message": {"chat": {"id": 987654321}},
            "data": "confirm_order",
        },
    }
    parsed = _parse_telegram_update(body)
    assert parsed is not None
    assert parsed["update_id"] == 123456790
    assert parsed["chat_id"] == 987654321
    assert parsed["text"] is None
    assert parsed["callback_data"] == "confirm_order"


def test_parse_telegram_update_missing_update_id() -> None:
    body = {"message": {"chat": {"id": 1}, "text": "hi"}}
    assert _parse_telegram_update(body) is None


def test_parse_telegram_update_empty() -> None:
    assert _parse_telegram_update({}) is None
