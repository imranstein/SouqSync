"""Webhook endpoints for external services (Telegram, etc.)."""

from __future__ import annotations

from typing import Any

import structlog
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.services.bot_handler import handle_update

router = APIRouter()
logger = structlog.get_logger(__name__)


def _parse_telegram_update(body: dict[str, Any]) -> dict[str, Any] | None:
    """Extract update_id, chat_id, and payload (text or callback_data) for idempotency and logging."""
    update_id = body.get("update_id")
    if update_id is None:
        return None

    result: dict[str, Any] = {"update_id": update_id, "chat_id": None, "text": None, "callback_data": None}

    if "message" in body:
        msg = body["message"]
        result["chat_id"] = msg.get("chat", {}).get("id")
        if "text" in msg:
            result["text"] = msg["text"]
    elif "callback_query" in body:
        cq = body["callback_query"]
        result["chat_id"] = cq.get("message", {}).get("chat", {}).get("id")
        result["callback_data"] = cq.get("data")

    return result


@router.post(
    "/telegram",
    summary="Receive Telegram updates",
    response_description="Always 200; process asynchronously.",
)
async def telegram_webhook(request: Request) -> JSONResponse:
    """
    Receive Telegram Bot API updates. POST only; no GET verification.
    Parses update, routes through bot handler, returns 200 quickly.

    **Test in Swagger:** Use "Try it out", set body to raw JSON. Example:
    ```json
    {"update_id": 123456789, "message": {"message_id": 1, "from": {"id": 111, "first_name": "Test"}, "chat": {"id": 111, "type": "private"}, "text": "/start"}}
    ```
    """
    try:
        body = await request.json()
    except Exception as e:
        logger.warning("telegram_webhook_invalid_body", error=str(e))
        return JSONResponse(content={"ok": True}, status_code=200)

    parsed = _parse_telegram_update(body)
    if parsed:
        logger.info(
            "telegram_update",
            update_id=parsed["update_id"],
            chat_id=parsed["chat_id"],
            text=parsed["text"],
            callback_data=parsed["callback_data"],
        )
    else:
        logger.info("telegram_update_unparsed", update_id=body.get("update_id"), keys=list(body.keys()))

    try:
        await handle_update(body)
    except Exception as exc:
        logger.error("bot_handler_error", error=str(exc), update_id=body.get("update_id"))

    return JSONResponse(content={"ok": True}, status_code=200)
