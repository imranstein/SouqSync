"""Unit tests for bot_handler — conversation state machine."""

from __future__ import annotations

from app.services.conversation import ConversationStep, get_state, reset_state


class TestConversationState:
    def test_new_user_gets_new_state(self) -> None:
        reset_state(99999)
        state = get_state(99999)
        assert state.step == ConversationStep.NEW
        assert state.language == "en"
        assert state.cart == []

    def test_state_persists(self) -> None:
        reset_state(88888)
        state = get_state(88888)
        state.step = ConversationStep.REGISTERED
        state.language = "am"

        same = get_state(88888)
        assert same.step == ConversationStep.REGISTERED
        assert same.language == "am"

    def test_reset_clears_state(self) -> None:
        state = get_state(77777)
        state.step = ConversationStep.REGISTERED
        reset_state(77777)
        fresh = get_state(77777)
        assert fresh.step == ConversationStep.NEW


class TestCopyLocalization:
    def test_english_fallback(self) -> None:
        from app.services.copy import t

        result = t("welcome", "en")
        assert "SoukSync" in result

    def test_amharic(self) -> None:
        from app.services.copy import t

        result = t("welcome", "am")
        assert "SoukSync" in result
        assert "\u12a5\u1295\u1243\u1295" in result

    def test_unknown_key_returns_key(self) -> None:
        from app.services.copy import t

        result = t("nonexistent_key", "en")
        assert result == "nonexistent_key"

    def test_format_kwargs(self) -> None:
        from app.services.copy import t

        result = t("order_confirmed", "en", order_id="SS-TEST-001", window="Tomorrow")
        assert "SS-TEST-001" in result
        assert "Tomorrow" in result
