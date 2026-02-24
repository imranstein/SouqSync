"""Telegram Bot API client — send messages, inline keyboards, voice notes."""

from __future__ import annotations

from typing import Any

import httpx
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)

_BASE_URL = "https://api.telegram.org/bot{token}"


def _api_url(method: str) -> str:
    return f"{_BASE_URL.format(token=settings.TELEGRAM_BOT_TOKEN)}/{method}"


async def send_message(
    chat_id: int,
    text: str,
    reply_markup: dict[str, Any] | None = None,
    parse_mode: str = "HTML",
) -> dict[str, Any] | None:
    payload: dict[str, Any] = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
    if reply_markup:
        payload["reply_markup"] = reply_markup

    return await _post("sendMessage", payload)


async def answer_callback_query(callback_query_id: str, text: str | None = None) -> dict[str, Any] | None:
    payload: dict[str, Any] = {"callback_query_id": callback_query_id}
    if text:
        payload["text"] = text
    return await _post("answerCallbackQuery", payload)


def inline_keyboard(rows: list[list[dict[str, str]]]) -> dict[str, Any]:
    """Build an InlineKeyboardMarkup from a list of button rows.

    Each button: {"text": "Label", "callback_data": "value"}
    """
    return {"inline_keyboard": rows}


async def _post(method: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("telegram_bot_token_missing", method=method)
        return None

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(_api_url(method), json=payload)
            data = resp.json()
            if not data.get("ok"):
                logger.error("telegram_api_error", method=method, response=data)
            return data
        except Exception as exc:
            logger.error("telegram_api_exception", method=method, error=str(exc))
            return None
