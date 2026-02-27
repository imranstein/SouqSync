import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_request_otp_invalid_phone_format():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Invalid phone format: too short
        # This will return 422 because of length validation
        response = await client.post("/api/v1/auth/request-otp", json={"phone": "123"})
        assert response.status_code == 422

        # Invalid phone format: non-numeric characters (excluding '+')
        # This currently PASSES (200) because it meets length check (9 chars)
        # We want it to FAIL (422) after our fix.
        response = await client.post("/api/v1/auth/request-otp", json={"phone": "abc123456"})
        assert response.status_code == 422

@pytest.mark.asyncio
async def test_request_otp_valid_phone_format():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Valid phone format
        response = await client.post("/api/v1/auth/request-otp", json={"phone": "+251911234567"})
        assert response.status_code == 200
