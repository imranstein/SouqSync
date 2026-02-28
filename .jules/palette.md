## 2025-01-01 - Accessible Error States and Interactive Loaders
**Learning:** Adding role="alert" and aria-live="polite" to form error containers ensures screen readers announce validation errors immediately. Additionally, icon-only loaders require screen reader text (sr-only) and aria-hidden="true" on the visual SVG to provide context without redundant noise.
**Action:** Always include ARIA roles for dynamic form errors and visually hidden text for interactive loading indicators to meet accessibility standards.
