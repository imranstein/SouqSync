## 2026-02-25 - Sensitive Data Exposure in Logs

**Vulnerability:** The `request_otp` function in `backend/app/services/auth_service.py` was unconditionally logging the generated OTP, which exposes sensitive authentication data in application logs.

**Learning:** Logging sensitive data (like OTPs) for debugging purposes in an MVP phase can become a security risk if not properly gated. It's crucial to ensure that such logs are only active in development/debug environments.

**Prevention:** Always wrap debug-only logging statements with `if settings.DEBUG:` or similar environment checks. Regularly audit logs for sensitive information leakage.
