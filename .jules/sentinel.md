## 2026-02-25 - Sensitive Data Exposure in Logs

**Vulnerability:** The `request_otp` function in `backend/app/services/auth_service.py` was unconditionally logging the generated OTP, which exposes sensitive authentication data in application logs.

**Learning:** Logging sensitive data (like OTPs) for debugging purposes in an MVP phase can become a security risk if not properly gated. It's crucial to ensure that such logs are only active in development/debug environments.

**Prevention:** Always wrap debug-only logging statements with `if settings.DEBUG:` or similar environment checks. Regularly audit logs for sensitive information leakage.

## 2026-02-25 - Insecure Randomness in Order IDs

**Vulnerability:** The `_generate_order_id` function in `backend/app/services/bot_handler.py` used the `random` module (`random.choices`) to generate the random portion of order IDs. The `random` module is not cryptographically secure and its outputs can be predictable.

**Learning:** Predictable identifiers can lead to Information Disclosure, Insecure Direct Object References (IDOR), or business logic flaws if an attacker can guess order IDs.

**Prevention:** Always use cryptographically secure pseudo-random number generators (CSPRNG), such as the `secrets` module in Python, for generating tokens, passwords, and other sensitive identifiers.
