"""In-memory conversation state for Telegram bot.

Tracks each chat's current step (language, registration, ordering) and data.
Replace with Redis or DB persistence for production.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ConversationStep(str, Enum):
    NEW = "new"
    AWAITING_LANGUAGE = "awaiting_language"
    AWAITING_SHOP_NAME = "awaiting_shop_name"
    AWAITING_LOCATION = "awaiting_location"
    AWAITING_SHOP_TYPE = "awaiting_shop_type"
    REGISTERED = "registered"
    BROWSING_CATEGORIES = "browsing_categories"
    BROWSING_PRODUCTS = "browsing_products"
    CART_REVIEW = "cart_review"
    AWAITING_PAYMENT_CHOICE = "awaiting_payment_choice"
    ORDER_CONFIRMED = "order_confirmed"


@dataclass
class ConversationState:
    step: ConversationStep = ConversationStep.NEW
    language: str = "en"
    shop_name: str = ""
    location: str = ""
    shop_type: str = ""
    cart: list[dict[str, Any]] = field(default_factory=list)
    current_category: str = ""
    data: dict[str, Any] = field(default_factory=dict)


_states: dict[int, ConversationState] = {}


def get_state(chat_id: int) -> ConversationState:
    if chat_id not in _states:
        _states[chat_id] = ConversationState()
    return _states[chat_id]


def reset_state(chat_id: int) -> None:
    _states.pop(chat_id, None)
