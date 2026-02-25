"""Integration test for OTP verification security."""
import pytest
from httpx import AsyncClient

# We will implement a limit of 5 failed attempts
MAX_OTP_ATTEMPTS = 5

@pytest.mark.asyncio
async def test_otp_brute_force_prevention(client: AsyncClient):
    """
    Test that OTP verification endpoint limits the number of failed attempts.
    """
    phone = "+251911999999"

    # 1. Request OTP
    response = await client.post("/api/v1/auth/request-otp", json={"phone": phone})
    assert response.status_code == 200

    # 2. Try incorrect OTPs MAX_OTP_ATTEMPTS times
    # These should all fail with 401 Unauthorized
    for i in range(MAX_OTP_ATTEMPTS):
        response = await client.post(
            "/api/v1/auth/verify-otp",
            json={"phone": phone, "code": f"00000{i}"} # Incorrect code
        )
        assert response.status_code == 401, f"Attempt {i+1} failed with status {response.status_code}"
        assert response.json()["detail"] == "Invalid or expired OTP"

    # 3. Try one more time - should be blocked
    # This assertion is expected to FAIL until we implement the rate limiting
    response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": phone, "code": "000006"}
    )

    # We expect 429 Too Many Requests once implemented
    assert response.status_code == 429, f"Expected 429, got {response.status_code}"
