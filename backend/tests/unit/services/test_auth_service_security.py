import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from app.services.auth_service import verify_otp, _memory_store, hash_otp
import time

@pytest.mark.asyncio
async def test_verify_otp_rate_limiting_memory():
    """Test that verify_otp limits failed attempts using in-memory store."""
    # Use in-memory path (redis=None)
    with patch("app.services.auth_service._get_redis", return_value=None), \
         patch.dict("app.services.auth_service._memory_store", {}, clear=True):

        phone = "1234567890"
        valid_code = "123456"
        wrong_code = "000000"

        # Setup: Pre-populate an OTP
        expires_at = time.time() + 300
        # We access the _memory_store directly from the imported module in the test context
        # But wait, patch.dict modifies the imported object in place usually.
        # Let's verify if we need to access it via the module or the patched dict.
        # Since we imported _memory_store, that reference might be stale if patch replaces the object.
        # But patch.dict modifies the contents of the dictionary in place, so the reference is fine.
        from app.services.auth_service import _memory_store as store_ref
        store_ref[f"otp:{phone}"] = (hash_otp(valid_code), expires_at)

        mock_db = AsyncMock()

        # Act: Try 5 times with wrong code (Limit is 5)
        # 1st attempt
        with pytest.raises(HTTPException) as exc:
            await verify_otp(phone, wrong_code, mock_db)
        assert exc.value.status_code == 401

        # 2nd attempt
        with pytest.raises(HTTPException) as exc:
            await verify_otp(phone, wrong_code, mock_db)
        assert exc.value.status_code == 401

        # 3rd attempt
        with pytest.raises(HTTPException) as exc:
            await verify_otp(phone, wrong_code, mock_db)
        assert exc.value.status_code == 401

        # 4th attempt
        with pytest.raises(HTTPException) as exc:
            await verify_otp(phone, wrong_code, mock_db)
        assert exc.value.status_code == 401

        # 5th attempt
        with pytest.raises(HTTPException) as exc:
            await verify_otp(phone, wrong_code, mock_db)
        assert exc.value.status_code == 401

        # 6th attempt -> Should be 429
        with pytest.raises(HTTPException) as exc:
            await verify_otp(phone, wrong_code, mock_db)
        assert exc.value.status_code == 429

@pytest.mark.asyncio
async def test_verify_otp_success_resets_attempts_memory():
    """Test that successful verification resets attempts."""
    with patch("app.services.auth_service._get_redis", return_value=None), \
         patch.dict("app.services.auth_service._memory_store", {}, clear=True):

        phone = "9876543210"
        valid_code = "654321"
        wrong_code = "111111"

        expires_at = time.time() + 300
        from app.services.auth_service import _memory_store as store_ref
        store_ref[f"otp:{phone}"] = (hash_otp(valid_code), expires_at)

        mock_db = AsyncMock()
        # Mock DB execute result for user lookup/creation
        # The result of await db.execute() is a Result object, which is synchronous
        from unittest.mock import MagicMock
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None # New user
        mock_db.execute.return_value = mock_result

        # Also need to mock db.add, db.commit, db.refresh
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # 1. Fail once
        with pytest.raises(HTTPException) as exc:
            await verify_otp(phone, wrong_code, mock_db)
        assert exc.value.status_code == 401

        # Verify attempt counter exists (it's "otp:attempts:{phone}")
        # Note: Implementation detail, but we know key name
        assert f"otp:attempts:{phone}" in store_ref

        # 2. Succeed
        await verify_otp(phone, valid_code, mock_db)

        # 3. Verify attempt counter is GONE
        assert f"otp:attempts:{phone}" not in store_ref
