import pytest
from unittest.mock import patch, AsyncMock
import app.services.auth_service as auth_service
from app.services.auth_service import request_otp
from app.core.config import settings


@pytest.fixture(autouse=True)
def clear_memory_store():
    auth_service._memory_store.clear()
    yield
    auth_service._memory_store.clear()


@pytest.mark.asyncio
async def test_otp_logging_debug_true():
    with patch("app.services.auth_service._get_redis", new_callable=AsyncMock, return_value=None):
        with patch("app.services.auth_service.logger") as mock_logger:
            with patch.object(settings, "DEBUG", True):
                await request_otp("1234567890")

                assert mock_logger.info.called
                args, kwargs = mock_logger.info.call_args
                assert args[0] == "otp_generated"
                assert "otp" in kwargs
                assert "phone" in kwargs
                assert kwargs["phone"] == "1234567890"


@pytest.mark.asyncio
async def test_otp_logging_debug_false():
    with patch("app.services.auth_service._get_redis", new_callable=AsyncMock, return_value=None):
        with patch("app.services.auth_service.logger") as mock_logger:
            with patch.object(settings, "DEBUG", False):
                await request_otp("0987654321")

                assert mock_logger.info.called
                args, kwargs = mock_logger.info.call_args
                assert args[0] == "otp_generated"
                assert "otp" not in kwargs
                assert "phone" in kwargs
                assert kwargs["phone"] == "0987654321"
