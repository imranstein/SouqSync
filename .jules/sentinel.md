## 2026-02-25 - Critical: OTPs Logged in Production
**Vulnerability:** The application was logging generated One-Time Passwords (OTPs) to the application logs, including in production environments.
**Learning:** This was done to facilitate testing ("MVP: logged, not sent via SMS") but exposed sensitive authentication tokens to anyone with log access.
**Prevention:** Always wrap sensitive debug logging in a `DEBUG` mode check or use a dedicated development-only channel that is disabled by default in production.
