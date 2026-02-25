"""Telegram bot message handler — routes updates through conversation state machine."""

from __future__ import annotations

import random
import string
from datetime import datetime, timezone
from typing import Any

import structlog

from app.services import telegram_bot as tg
from app.services.conversation import ConversationState, ConversationStep, get_state
from app.services.copy import LOCATIONS, SAMPLE_PRODUCTS, SHOP_TYPES, t

logger = structlog.get_logger(__name__)

_LANG_MAP = {"1": "am", "2": "om", "3": "en"}
_ORDER_INTENTS = {"order", "reorder", "ትዕዛዝ", "ድገም", "ajaja", "irra"}
_HELP_INTENTS = {"help", "እገዛ", "gargaarsa"}
_CREDIT_INTENTS = {"credit", "ክሬዲት", "liqii"}
_CHECKOUT_INTENTS = {"checkout", "ክፍያ", "kafaltii"}
_CANCEL_INTENTS = {"cancel", "ይቅር", "haquu"}


async def handle_update(body: dict[str, Any]) -> None:
    """Top-level dispatcher for an incoming Telegram update."""
    if "message" in body:
        msg = body["message"]
        chat_id = msg.get("chat", {}).get("id")
        text = msg.get("text", "").strip()
        if chat_id and text:
            await _handle_text(chat_id, text)
    elif "callback_query" in body:
        cq = body["callback_query"]
        chat_id = cq.get("message", {}).get("chat", {}).get("id")
        data = cq.get("data", "")
        cq_id = cq.get("id", "")
        if chat_id:
            await tg.answer_callback_query(cq_id)
            await _handle_text(chat_id, data)


async def _handle_text(chat_id: int, text: str) -> None:
    state = get_state(chat_id)
    lower = text.lower()

    if lower == "/start" or state.step == ConversationStep.NEW:
        state.step = ConversationStep.AWAITING_LANGUAGE
        await tg.send_message(chat_id, t("welcome", "en"))
        return

    if state.step == ConversationStep.AWAITING_LANGUAGE:
        await _set_language(chat_id, state, text)
        return

    if state.step == ConversationStep.AWAITING_SHOP_NAME:
        await _set_shop_name(chat_id, state, text)
        return

    if state.step == ConversationStep.AWAITING_LOCATION:
        await _set_location(chat_id, state, text)
        return

    if state.step == ConversationStep.AWAITING_SHOP_TYPE:
        await _set_shop_type(chat_id, state, text)
        return

    if state.step == ConversationStep.BROWSING_CATEGORIES:
        await _browse_category(chat_id, state, text)
        return

    if state.step == ConversationStep.BROWSING_PRODUCTS:
        await _add_to_cart(chat_id, state, text)
        return

    if state.step == ConversationStep.CART_REVIEW:
        await _cart_action(chat_id, state, lower)
        return

    if state.step == ConversationStep.AWAITING_PAYMENT_CHOICE:
        await _payment_choice(chat_id, state, text)
        return

    if any(kw in lower for kw in _HELP_INTENTS):
        await tg.send_message(chat_id, t("help", state.language))
        return

    if any(kw in lower for kw in _ORDER_INTENTS):
        await _start_order(chat_id, state)
        return

    if any(kw in lower for kw in _CREDIT_INTENTS):
        await tg.send_message(
            chat_id,
            "💳 Credit: Coming soon! Your profile is being set up."
            if state.language == "en"
            else "💳 ክሬዲት: በቅርቡ ይመጣል!"
            if state.language == "am"
            else "💳 Liqii: Dhiyootti ni dhufa!",
        )
        return

    await tg.send_message(chat_id, t("unknown", state.language))


async def _set_language(chat_id: int, state: ConversationState, text: str) -> None:
    lang = _LANG_MAP.get(text.strip())
    if not lang:
        await tg.send_message(chat_id, "Please reply 1, 2, or 3.")
        return

    state.language = lang
    state.step = ConversationStep.AWAITING_SHOP_NAME
    await tg.send_message(chat_id, t("lang_set", lang))
    await tg.send_message(chat_id, t("ask_shop_name", lang))


async def _set_shop_name(chat_id: int, state: ConversationState, text: str) -> None:
    state.shop_name = text
    state.step = ConversationStep.AWAITING_LOCATION
    await tg.send_message(
        chat_id,
        f"✅ {text}\n\n{t('ask_location', state.language)}",
    )


async def _set_location(chat_id: int, state: ConversationState, text: str) -> None:
    state.location = LOCATIONS.get(text.strip(), text)
    state.step = ConversationStep.AWAITING_SHOP_TYPE
    await tg.send_message(chat_id, t("ask_shop_type", state.language))


async def _set_shop_type(chat_id: int, state: ConversationState, text: str) -> None:
    state.shop_type = SHOP_TYPES.get(text.strip(), text)
    state.step = ConversationStep.REGISTERED
    await tg.send_message(
        chat_id,
        t(
            "registration_complete",
            state.language,
            shop_name=state.shop_name,
            location=state.location,
            shop_type=state.shop_type,
        ),
    )


async def _start_order(chat_id: int, state: ConversationState) -> None:
    state.step = ConversationStep.BROWSING_CATEGORIES
    state.cart = []
    await tg.send_message(chat_id, t("categories", state.language))


async def _browse_category(chat_id: int, state: ConversationState, text: str) -> None:
    cat_key = text.strip()
    products = SAMPLE_PRODUCTS.get(cat_key)
    if not products:
        await tg.send_message(chat_id, t("categories", state.language))
        return

    state.current_category = cat_key
    state.step = ConversationStep.BROWSING_PRODUCTS

    lines = []
    for i, p in enumerate(products, 1):
        lines.append(f"{i}. {p['name']} — ETB {p['price']}")

    msg = "\n".join(lines) + "\n\nReply with a number to add, or BACK."
    await tg.send_message(chat_id, msg)


async def _add_to_cart(chat_id: int, state: ConversationState, text: str) -> None:
    lower = text.strip().lower()

    if lower == "back":
        state.step = ConversationStep.BROWSING_CATEGORIES
        await tg.send_message(chat_id, t("categories", state.language))
        return

    if lower in ("cart", "ጋሪ", "gaarii"):
        await _show_cart(chat_id, state)
        return

    products = SAMPLE_PRODUCTS.get(state.current_category, [])
    try:
        idx = int(text.strip()) - 1
        if 0 <= idx < len(products):
            product = products[idx]
            state.cart.append({"name": product["name"], "price": product["price"], "qty": 1})
            await tg.send_message(
                chat_id,
                f"🛒 Added {product['name']} (ETB {product['price']})\n"
                f"Cart: {len(state.cart)} item(s). Reply number to add more, CART, or BACK.",
            )
            return
    except ValueError:
        pass

    if any(kw in lower for kw in _CHECKOUT_INTENTS):
        await _show_cart(chat_id, state)
        return

    await tg.send_message(chat_id, "Reply with a product number, CART, or BACK.")


async def _show_cart(chat_id: int, state: ConversationState) -> None:
    if not state.cart:
        await tg.send_message(chat_id, "Your cart is empty. Browse categories first.")
        state.step = ConversationStep.BROWSING_CATEGORIES
        await tg.send_message(chat_id, t("categories", state.language))
        return

    items_text = "\n".join(f"  • {i['name']} x{i['qty']} — ETB {i['price']}" for i in state.cart)
    total = sum(i["price"] * i["qty"] for i in state.cart)
    state.step = ConversationStep.CART_REVIEW
    await tg.send_message(
        chat_id, t("cart_summary", state.language, items=items_text, total=str(total))
    )


async def _cart_action(chat_id: int, state: ConversationState, lower: str) -> None:
    if any(kw in lower for kw in _CHECKOUT_INTENTS) or lower in ("yes", "አዎ", "eeyyee"):
        state.step = ConversationStep.AWAITING_PAYMENT_CHOICE
        await tg.send_message(chat_id, t("payment_choice", state.language))
        return

    if any(kw in lower for kw in _CANCEL_INTENTS):
        state.cart = []
        state.step = ConversationStep.REGISTERED
        await tg.send_message(chat_id, "Cart cleared. Send Order to start again.")
        return

    if lower in ("edit", "አርም", "sirreessi"):
        state.step = ConversationStep.BROWSING_CATEGORIES
        state.cart = []
        await tg.send_message(chat_id, "Cart cleared for editing.\n" + t("categories", state.language))
        return

    await _show_cart(chat_id, state)


async def _payment_choice(chat_id: int, state: ConversationState, text: str) -> None:
    choice = text.strip()
    if choice not in ("1", "2"):
        await tg.send_message(chat_id, "Reply 1 for Pay Now or 2 for BNPL.")
        return

    order_id = _generate_order_id()
    window = "Tomorrow 8AM-12PM"

    logger.info(
        "order_created",
        chat_id=state.data.get("chat_id"),
        order_id=order_id,
        items=len(state.cart),
        total=sum(i["price"] * i["qty"] for i in state.cart),
        payment="pay_now" if choice == "1" else "bnpl",
    )

    state.step = ConversationStep.ORDER_CONFIRMED
    await tg.send_message(
        chat_id,
        t("order_confirmed", state.language, order_id=order_id, window=window),
    )

    state.cart = []
    state.step = ConversationStep.REGISTERED


def _generate_order_id() -> str:
    date_part = datetime.now(tz=timezone.utc).strftime("%Y%m%d")
    rand_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"SS-{date_part}-{rand_part}"
