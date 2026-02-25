import pytest
from unittest.mock import patch
from app.services.auth_service import request_otp
from app.core.config import settings

@pytest.mark.asyncio
async def test_otp_logging_debug_true():
    with patch("app.services.auth_service.logger") as mock_logger:
        with patch.object(settings, "DEBUG", True):
            # We need to mock redis or it will try to connect and fail/fallback
            # The fallback uses memory, so it should be fine.
            # But request_otp calls _get_redis which might log a warning.

            await request_otp("1234567890")

            # Verify logger called with otp
            # structlog logger.info is called with msg as first arg and kwargs
            # mock_logger.info("otp_generated", phone=..., otp=...)

            assert mock_logger.info.called
            args, kwargs = mock_logger.info.call_args
            assert args[0] == "otp_generated"
            assert "otp" in kwargs
            assert "phone" in kwargs
            assert kwargs["phone"] == "1234567890"

@pytest.mark.asyncio
async def test_otp_logging_debug_false():
    with patch("app.services.auth_service.logger") as mock_logger:
        with patch.object(settings, "DEBUG", False):
            await request_otp("0987654321")

            # Verify logger called WITHOUT otp
            assert mock_logger.info.called
            args, kwargs = mock_logger.info.call_args
            assert args[0] == "otp_generated"
            assert "otp" not in kwargs
            assert "phone" in kwargs
            assert kwargs["phone"] == "0987654321"
