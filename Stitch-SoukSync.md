# SoukSync — Stitch Project & Prompts

This document records the **Stitch** (stitch.withgoogle.com) project and the exact prompts used to generate the **Landing**, **Dashboard**, **Credit & BNPL**, and **Inventory** screens, aligned with the **SoukSync Strategic Assessment** and your requirements: modern, captivating, animation-filled, innovative, with great design, branding, and fonts.

---

## Project

| Field | Value |
|-------|--------|
| **Project title** | SoukSync Web Landing and Dashboard |
| **Project ID** | `10444909056997061431` (full: `projects/10444909056997061431`) |
| **Device** | Desktop (Stitch may output mobile; content is desktop-oriented) |
| **Screen IDs** | See `stitch.json` (landing, dashboard, credit, inventory) |

---

## Strategic context (from PDF)

- **Product:** Asset-light B2B FMCG marketplace + embedded BNPL for Ethiopia & East Africa.
- **Users:** Kiosk (souk) owners, distributors. High-glare, fast intuitive interfaces, minimal text.
- **Brand:** Financial dignity + logistical reliability. Colors: energetic orange + institutional navy.
- **UI/UX (from PDF Section B):** Vibrant, highly visual, energetic, trustworthy. High-contrast Credit Health card, visual product catalog, prominent 1-Click Restock (navy), bold legible typography.

**Note on color palette:** The Stitch prompts below reference the original brand colors (institutional navy #1B2A4A and energetic orange #FF6B35) from the strategic assessment. However, the actual landing page implementation (`web/src/pages/LandingPage.tsx`) uses a teal/slate palette (TEAL_600 #0d9488, SLATE_900 #0f172a) for a modern, refined aesthetic. The Stitch prompts serve as design reference documentation and may differ from the final implementation.

---

## Screen 1: Landing Page

| Field | Value |
|-------|--------|
| **Screen title** | SoukSync Landing Page Main |
| **Screen ID** | `8fb87c83aa6b451e9da253dd282d46e1` |

### Prompt (copy for Stitch)

```text
Design a modern, captivating, animation-ready desktop LANDING PAGE for 'SoukSync', an asset-light B2B fast-moving consumer goods marketplace and embedded Buy-Now-Pay-Later (BNPL) platform for Ethiopia and East Africa.

**Brand (from strategy):** Financial dignity and logistical reliability. Color palette: institutional navy blue (#1B2A4A) as primary, energetic orange (#FF6B35) as accent. Typography: bold, legible, distinctive—use a strong display font for headlines and a clean sans-serif for body. Tone: vibrant, highly visual, energetic, trustworthy.

**Note:** This prompt reflects the original brand specification. The actual implementation uses a teal/slate palette (see note above).

**Required sections and functionality:**
1. **Sticky header:** Logo (SoukSync — 'Souk' in navy, 'Sync' in orange), nav links (Features, How it works), prominent Sign in CTA button (navy, pill-shaped).
2. **Hero:** Full-width gradient background (navy to dark navy). Headline: 'Your Market, Your Power' (large, bold, white with orange accent on 'Your Power'). Subline: 'B2B FMCG Marketplace · Ethiopia & East Africa'. Supporting copy: one sentence on connecting distributors, restocking, and BNPL for kiosk owners. Two CTAs: primary 'Get Started' (orange, pill), secondary 'See how it works' (outline). Space for a hero image or visual (market/kiosk/digital theme).
3. **Features:** Section title 'Built for the souk'. Three feature cards in a grid: (1) Never run out of stock — smart restocking, one-tap reorders; (2) Get instant credit — BNPL in ETB, grow without cash flow stress; (3) Order in one tap — restock bestsellers, connect distributors. Each card: icon/visual, title, short description. Light card background, subtle shadow.
4. **How it works:** Three steps: (1) Sign up — phone + OTP, no passwords; (2) Get approved — shop assessment, BNPL credit; (3) Order & grow — browse, place orders, one-tap restock. Numbered circles (orange), title, short text. Horizontal layout.
5. **CTA block:** Navy gradient background. Headline 'Ready to power your kiosk?'. Subline about joining distributors and kiosk owners. Single CTA button 'Sign in to dashboard' (orange).
6. **Footer:** Logo, copyright, Sign in link. Minimal, clean.

**Design directives:** Modern and innovative layout with clear hierarchy. Use generous whitespace. Make the page feel animation-ready (clear sections and cards so fade-in and scroll effects can be applied in code). High-contrast for accessibility. No clutter. Professional B2B feel with warmth and energy.
```

---

## Screen 2: Dashboard

| Field | Value |
|-------|--------|
| **Screen title** | SoukSync Merchant Dashboard |
| **Screen ID** | `6582494c066943ea9c7a68355381bd07` |

### Prompt (copy for Stitch)

```text
Design a modern, captivating DESKTOP DASHBOARD for 'SoukSync', the B2B FMCG marketplace and BNPL platform for Ethiopia. This is the main dashboard a kiosk owner or distributor sees after sign-in.

**Brand:** Same as landing—institutional navy (#1B2A4A), energetic orange (#FF6B35). Bold, legible typography. Vibrant, trustworthy, professional.

**Note:** This prompt reflects the original brand specification. The actual implementation may use a different palette (see note above).

**Layout:**
1. **Sidebar (left):** Dark navy background. Logo 'SoukSync' at top (Souk navy, Sync orange). Navigation: Dashboard (active), Inventory, Orders, Credit, Profile; for admin also Settings. Icons + labels. Footer with small copyright.
2. **Top bar:** White, border-bottom. Language selector (dropdown). User name and role. Avatar initial. Sign out icon button.
3. **Main content:**
   - **Welcome block:** 'Welcome back, [Name]' (large), short subtitle. Use Syne-style bold for heading.
   - **KPI cards (4 in a row):** (1) Total products — count with box icon; (2) Pending orders — count with clock icon; (3) Total revenue (ETB) — sum with currency icon; (4) Credit available (ETB) — amount with card icon. Cards: white, rounded-2xl, soft shadow, hover lift. Orange/teal accent for icon background.
   - **Two-column widgets:**
     - **Recent orders:** Table with columns ID, Status, Total, Date. Status pills (pending=yellow, confirmed=yellow, in_transit=blue, delivered=green, cancelled=red). Rounded card, clean table.
     - **Product catalog:** Table with Name, Category, Price (ETB). Up to 8 rows, then 'Showing 8 of N'. Same card style.
   - Empty states: friendly message + icon when no orders or no products.

**Functionality:** Dashboard is data-driven: KPIs and tables are clearly placeholders for live data. Design for animation (staggered card entrance). High contrast, clear hierarchy. Dense but scannable.
```

---

## Screen 3: Credit & BNPL

| Field | Value |
|-------|--------|
| **Screen title** | SoukSync Credit & BNPL Management |
| **Screen ID** | `4e6260ce6610430988e623e025549f7f` |

### Prompt (copy for Stitch)

```text
Design a modern, captivating DESKTOP **Credit & BNPL** page for 'SoukSync', the B2B FMCG marketplace and BNPL platform for Ethiopia. This is the screen where kiosk owners see their Buy Now Pay Later credit and repayment status.

**Brand:** Institutional navy (#1B2A4A), energetic orange (#FF6B35). Bold, legible typography. Vibrant, trustworthy. (From DESIGN.md)

**Note:** This prompt reflects the original brand specification. The actual implementation may use a different palette (see note above).

**Layout and functionality:**
1. Same app chrome: dark navy sidebar (logo, Dashboard, Inventory, Orders, Credit active, Profile), white top bar (language, user, sign out).
2. **Page title:** 'Credit & BNPL' with short subtitle about managing your credit limit and repayments.
3. **Credit Health card (hero):** Large, high-contrast card (from strategy: massive Credit Health at top). Show: Available credit in ETB (big number), Credit limit ETB, Current balance ETB. Use navy/orange accents. Optional: progress bar or ring for usage. Trustworthy, clear.
4. **Repayment / activity section:** Table or list of recent credit transactions: date, description (e.g. Order #xxx, Repayment), amount (+ or -), balance after. Clean table with subtle borders.
5. **Optional:** Small callout or link to 'How BNPL works' or support. Empty state if no transactions yet.

Design for data-driven placeholders. Animation-ready. High contrast, scannable.
```

---

## Screen 4: Inventory / Product catalog

| Field | Value |
|-------|--------|
| **Screen title** | SoukSync Product Catalog Inventory |
| **Screen ID** | `acbaa58b57004c6e98631cd03636e761` |

### Prompt (copy for Stitch)

```text
Design a modern, captivating DESKTOP **Inventory / Product catalog** page for 'SoukSync', the B2B FMCG marketplace for Ethiopia. This is where kiosk owners or distributors browse and manage products.

**Brand:** Institutional navy (#1B2A4A), energetic orange (#FF6B35). Bold, legible typography. Vibrant, trustworthy. (From DESIGN.md)

**Note:** This prompt reflects the original brand specification. The actual implementation may use a different palette (see note above).

**Layout and functionality:**
1. Same app chrome: dark navy sidebar (logo, Dashboard, Inventory active, Orders, Credit, Profile), white top bar (language, user, sign out).
2. **Page title:** 'Inventory' or 'Product catalog' with subtitle (e.g. Browse and restock products).
3. **Filters/toolbar:** Optional search box, category dropdown, distributor filter. Clean, minimal.
4. **Product grid or table:** For desktop use a table: columns Name, SKU, Category, Price (ETB), Stock or Status, optional Actions (Reorder / Add to cart). Use cards or rows with soft shadow. High-contrast, scannable. If grid: large product image placeholders, name, price, one-tap reorder button (navy or orange).
5. **Pagination or 'Load more'** at bottom. Empty state: friendly message when no products.

Design for data-driven placeholders. Animation-ready. Dense but clear hierarchy.
```

---

## PDF-original Stitch prompt (mobile, for reference)

From **SoukSync Strategic Assessment**, Section B — UI/UX Design Generation (target: Google Stitch):

```
Context: Design a mobile app screen for 'SoukSync', a B2B supply chain and micro-credit application.
User: Informal retail kiosk (souk) owners in Ethiopia who operate in high-glare outdoor environments and require fast, intuitive interfaces with minimal text reading.
Goal of the screen: Allow the user to quickly view their available 'Buy Now, Pay Later' credit limit, browse available fast-moving consumer goods, and place a restock order with one tap.
Tone: Vibrant, highly visual, energetic, and trustworthy.
Specific Elements: Include a massive, high-contrast 'Credit Health' card layout at the very top displaying their available limit in ETB (Birr). Below it, create a highly visual product catalog grid using large product images as touch targets. Add a prominent, fixed bottom navigation bar with a distinct '1-Click Restock' primary call-to-action button colored in an authoritative, trusted navy blue. Ensure typography is bold and legible.
```

Use this for **mobile** Stitch screens (e.g. kiosk app); the prompts above are for **web**.

---

## How to use this in Stitch

1. Open [Stitch](https://stitch.withgoogle.com) and open the project with ID above.
2. For a **new screen**, use **Generate from text** and paste the relevant prompt from this file (or combine with DESIGN.md Section 6).
3. For **consistency**, always include the **Brand** and **Colors** bullets from DESIGN.md in your prompt.
4. To **export**: use Stitch’s export or the MCP `get_screen` with `projectId` and `screenId` to get `htmlCode.downloadUrl` and `screenshot.downloadUrl`.

---

## Functionality alignment (Stitch vs app)

| Page | Stitch screen | Implemented in app |
|------|----------------|--------------------|
| **Landing** | Landing Page Main | `web/src/pages/LandingPage.tsx` |
| **Dashboard** | Merchant Dashboard | `dashboard/src/components/layout.tsx`, `dashboard/src/pages/dashboard.tsx` |
| **Credit** | Credit & BNPL Management | `dashboard/src/pages/credit.tsx` (can be aligned to Stitch design) |
| **Inventory** | Product Catalog Inventory | `dashboard/src/pages/inventory.tsx` (can be aligned to Stitch design) |

Stitch provides the **design reference**; the React app implements (or can be updated to match) the same **sections and functionality**.
