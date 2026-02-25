import pytest
from unittest.mock import patch, AsyncMock
from app.services.auth_service import request_otp
from app.core.config import settings

@pytest.mark.asyncio
async def test_otp_logging_debug_true():
    # Mock redis to force in-memory fallback and avoid connection warnings
    with patch("app.services.auth_service.logger") as mock_logger:
        with patch("app.services.auth_service._get_redis", new_callable=AsyncMock) as mock_redis:
            mock_redis.return_value = None
            with patch.object(settings, "DEBUG", True):
                await request_otp("1234567890")

                # Verify logger called with otp
                assert mock_logger.info.called
                args, kwargs = mock_logger.info.call_args
                assert args[0] == "otp_generated"
                assert "otp" in kwargs
                assert "phone" in kwargs
                assert kwargs["phone"] == "1234567890"

@pytest.mark.asyncio
async def test_otp_logging_debug_false():
    # Mock redis to force in-memory fallback and avoid connection warnings
    with patch("app.services.auth_service.logger") as mock_logger:
        with patch("app.services.auth_service._get_redis", new_callable=AsyncMock) as mock_redis:
            mock_redis.return_value = None
            with patch.object(settings, "DEBUG", False):
                await request_otp("0987654321")

                # Verify logger called WITHOUT otp
                assert mock_logger.info.called
                args, kwargs = mock_logger.info.call_args
                assert args[0] == "otp_generated"
                assert "otp" not in kwargs
                assert "phone" in kwargs
                assert kwargs["phone"] == "0987654321"
