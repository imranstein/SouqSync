# Design System: SoukSync

**Stitch Project ID:** `projects/10444909056997061431`  
**Source:** SoukSync Strategic Assessment (Docs) + Stitch-generated screens (Landing, Dashboard).

---

## 1. Visual Theme & Atmosphere

- **Mood:** Vibrant, highly visual, energetic, and trustworthy. Professional B2B with warmth and financial dignity.
- **Context:** Asset-light B2B FMCG marketplace and BNPL for Ethiopia & East Africa. Users include kiosk (souk) owners and distributors; interfaces must work in high-glare environments and feel fast and intuitive.
- **Density:** Generous whitespace, clear hierarchy. Data-dense where needed (dashboard tables) but scannable. Animation-ready sections for fade-in and scroll effects.

---

## 2. Color Palette & Roles

| Name | Hex | Role |
|------|-----|------|
| Institutional Navy | `#1B2A4A` | Primary brand, headers, primary CTAs (Sign in), sidebar background |
| Navy Dark | `#0F1A30` | Hero/dark section gradients, depth |
| Energetic Orange | `#FF6B35` | Accent, "Sync" in logo, Get Started CTA, step numbers, active nav, key metrics |
| Ink | `#111827` | Body headings, table text |
| Muted Gray | `#6B7280` | Secondary text, captions |
| Card Background | `#FAFAFA` | Feature cards, footer, alternating sections |
| Surface | `#F3F4F6` | Page background |
| White | `#FFFFFF` | Nav bar (when sticky), dashboard cards, top bar |

**Status colors (dashboard):** Pending = yellow/amber; Confirmed = yellow; In Transit = blue; Delivered = green; Cancelled = red.

---

## 3. Typography Rules

- **Display / Headlines:** Bold, legible, distinctive. Use a strong display or geometric sans (e.g. Syne) for "Your Market, Your Power", "Built for the souk", "Welcome back".
- **Body:** Clean sans-serif (e.g. Outfit, Manrope) for descriptions, table content, and UI labels. Sizes: large for hero tagline, base for body, small for captions and table secondary.
- **Letter-spacing:** Slightly tight on headlines for impact; normal on body.

---

## 4. Component Stylings

- **Buttons:** Pill-shaped (rounded-full). Primary = solid navy or orange with white text and soft shadow; secondary = outline (white on dark, or border on light). Hover: slight scale and shadow increase.
- **Cards/Containers:** Rounded-2xl, light background (#FAFAFA or white), soft shadow (e.g. 0 1px 3px rgba(0,0,0,0.08)). Hover: optional lift (-translate-y) and stronger shadow.
- **Nav:** Sticky header with logo left, links center/right, Sign in CTA pill (navy). Sidebar: dark navy, logo at top, icon + label nav items, active state with orange/white accent.
- **Tables:** Minimal borders (divide-y), clear headers (uppercase, muted), row padding for readability. Status as pills (rounded-full, small text).

---

## 5. Layout Principles

- **Landing:** Single column with full-width hero; content max-width (e.g. max-w-6xl) for features, how-it-works, CTA. Clear sections (Features, How it works, CTA, Footer).
- **Dashboard:** Sidebar (fixed, ~256px) + top bar + scrollable main. Main: welcome block, then KPI grid (4 columns on desktop), then two-column widget grid (Recent orders | Product catalog). Use padding (p-4 lg:p-8) for breathing room.

---

## 6. Design System Notes for Stitch Generation

When prompting Stitch for new SoukSync screens, include:

- **Brand:** SoukSync — B2B FMCG marketplace and BNPL for Ethiopia & East Africa. Tone: vibrant, highly visual, energetic, trustworthy. Financial dignity and logistical reliability.
- **Colors:** Institutional navy `#1B2A4A` (primary, sidebars, primary CTAs), energetic orange `#FF6B35` (accent, key CTAs, active states). White and light grays for surfaces and cards.
- **Typography:** Bold display font for headlines, clean sans-serif for body. High contrast and legible.
- **Components:** Pill-shaped buttons, rounded-2xl cards with soft shadows, sticky nav with logo + links + CTA. Dashboard: dark navy sidebar, white top bar, KPI cards in a row, tables with status pills.
- **Functionality:** Design for real data (placeholders for counts, amounts, tables). Animation-ready (clear sections/cards for stagger and scroll effects). Accessible and scannable.
