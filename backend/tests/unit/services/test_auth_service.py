from unittest.mock import patch

import pytest
from app.services.auth_service import request_otp


@pytest.mark.asyncio
async def test_request_otp_logs_when_debug_true():
    with (
        patch("app.services.auth_service.settings") as mock_settings,
        patch("app.services.auth_service.logger") as mock_logger,
        patch("app.services.auth_service._get_redis", return_value=None),
    ):
        mock_settings.DEBUG = True

        await request_otp("1234567890")

        # Verify that logger.info was called with "otp_generated"
        # structlog calls are typically: logger.info("event_name", key=value)
        # We check if any call matches the event name
        otp_generated_calls = [
            call for call in mock_logger.info.call_args_list if call.args and call.args[0] == "otp_generated"
        ]
        assert len(otp_generated_calls) == 1
        # Check kwargs
        call = otp_generated_calls[0]
        assert call.kwargs["phone"] == "1234567890"
        assert "otp" in call.kwargs


@pytest.mark.asyncio
async def test_request_otp_does_not_log_when_debug_false():
    with (
        patch("app.services.auth_service.settings") as mock_settings,
        patch("app.services.auth_service.logger") as mock_logger,
        patch("app.services.auth_service._get_redis", return_value=None),
    ):
        mock_settings.DEBUG = False

        await request_otp("1234567890")

        # Verify that logger.info was NOT called with "otp_generated"
        otp_generated_calls = [
            call for call in mock_logger.info.call_args_list if call.args and call.args[0] == "otp_generated"
        ]
        assert len(otp_generated_calls) == 0
