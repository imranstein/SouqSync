## 2026-02-25 - Sensitive Data Exposure in Logs

**Vulnerability:** The `request_otp` function in `backend/app/services/auth_service.py` was unconditionally logging the generated OTP, which exposes sensitive authentication data in application logs.

**Learning:** Logging sensitive data (like OTPs) for debugging purposes in an MVP phase can become a security risk if not properly gated. It's crucial to ensure that such logs are only active in development/debug environments.

**Prevention:** Always wrap debug-only logging statements with `if settings.DEBUG:` or similar environment checks. Regularly audit logs for sensitive information leakage.

## 2026-02-25 - Missing Rate Limiting on OTP Verification

**Vulnerability:** The `verify_otp` endpoint in `backend/app/services/auth_service.py` lacked rate limiting, allowing attackers to brute-force the 6-digit OTP within the 5-minute validity window.

**Learning:** Rate limiting must be applied not just to resource-intensive endpoints (like sending SMS) but also to verification endpoints to prevent brute-force attacks on low-entropy secrets like OTPs.

**Prevention:** Implemented a failure counter that blocks verification attempts after 5 consecutive failures for a given phone number. The counter is reset upon successful verification.
