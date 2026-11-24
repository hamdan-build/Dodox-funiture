# DODOX Furniture — Full Repository Audit

**Repository:** `hamdan-build/Dodox-funiture`  
**Base branch audited:** `arena/0092a6ac-dodox-funiture` (commit `7bfb310aceb0f6eef1619d3d1b0520d784905390`)  
**Implementation branch:** `arena/db570b88-dodox-funiture`  
**Audit date:** 2026-11-24

---

## 1. Executive Summary

The existing repository contains a refined, well-structured **Next.js 15.5 App Router** frontend storefront for **DODOX Furniture** (Kigali, Rwanda). It implements a cohesive editorial aesthetic (`ivory`, `parchment`, `shell`, `bronze`, `ink`, `olive`, Cormorant Garamond + Inter self-hosted typography), complete browsing and configuration UX, accessible drawers/dialogs, client-side bag/wishlist state via Zustand, and form validation via React Hook Form + Zod v4.

However, **the entire application is currently a static/browser-only demonstration**:
- Zero API routes (`app/api/` does not exist).
- Zero database, ORM, or server persistence.
- Zero authentication, authorization, or admin dashboard (`/admin` does not exist).
- Order requests are written only to `window.localStorage` (`dodox.orders.v1`) with client-generated `DODO-XXXXXX` references.
- Contact, Custom Atelier, and Newsletter forms perform `setTimeout` delays and discard or hold state only in React component memory.
- Product pricing, discounts, and order totals are computed exclusively in the browser.
- Deployment configuration targets Netlify (`netlify.toml`) rather than Cloudflare Workers + D1 + R2.

---

## 2. Technology & Dependency Audit

| Package / Tool | Current Version | Purpose | Assessment |
| --- | --- | --- | --- |
| `next` | `15.5.29` | App Router framework | Compatible with `@opennextjs/cloudflare` (`>=15.5.29 <16`). Keep. |
| `react` / `react-dom` | `19.2.9` | UI library | Keep. |
| `typescript` | `^5.9.3` | Strict static typing | Keep. |
| `tailwindcss` / `@tailwindcss/postcss` | `^4.1.16` | Tailwind CSS v4 (`@theme` tokens in `app/globals.css`) | Keep; reuse design tokens across admin UI. |
| `zustand` | `^5.0.8` | Client cart, wishlist, UI drawer/toast stores | Keep for browser cart, wishlist, and UI state. |
| `zod` | `^4.1.12` | Validation schemas (`lib/validation.ts`) | Keep; note Zod v4 API (`z.literal(..., { message })`, `z.enum`, etc.). Extend for all server API payloads. |
| `react-hook-form` / `@hookform/resolvers` | `^7.66.0` / `^5.2.2` | Client form state & validation | Keep. |
| `lucide-react` | `^0.552.0` | Iconography | Keep; reuse in admin panel. |
| `sharp` | `^0.35.5` | Local Next.js image optimization | Keep for local builds; configure Cloudflare-compatible image handling for Workers. |
| `@netlify/plugin-nextjs` | `^5.16.6` | Legacy Netlify deployment plugin | Superseded by OpenNext for Cloudflare (`@opennextjs/cloudflare` + `wrangler`). |

---

## 3. Frontend Routes & Current Behaviour

| Route | File | Rendering Mode | Current Data Source | Backend Requirement |
| --- | --- | --- | --- | --- |
| `/` | `app/page.tsx` | Server Component | `data/site.ts`, `data/categories.ts`, `data/products.ts`, `data/journal.ts` | Load featured products, curated categories, homepage sections, banners, testimonials, journal preview, and site settings from D1. |
| `/shop` | `app/shop/page.tsx` | Dynamic Server Component (`searchParams`) + client `CatalogView` | `data/products.ts`, `data/categories.ts` | Load published products, categories, collections, materials, colors, and price bounds from D1; support server & client filtering, search, sorting, pagination. |
| `/shop/[slug]` | `app/shop/[slug]/page.tsx` | SSG (`generateStaticParams`) + client `PurchasePanel` | `data/products.ts`, `data/categories.ts`, `data/reviews.ts`, `data/site.ts` | Load published product, gallery, option groups/values, specs, dimensions, colors, materials, care steps, availability/stock, and related products from D1. |
| `/cart` | `app/cart/page.tsx` | Server shell + client `CartView` | `store/cart.ts` (`localStorage`), `data/site.ts`, `data/products.ts` | Keep Zustand client cart; validate coupon codes via server API (`/api/coupons/validate`) and fetch live care protection/VAT settings and recommended products. |
| `/checkout` | `app/checkout/page.tsx` | Server shell + client `CheckoutView` | `store/cart.ts`, `lib/orders.ts` (`localStorage`) | Replace `submitOrderRequest()` with `POST /api/orders`: server-side validation, product/variant price lookup, coupon verification, VAT & delivery calculation, atomic D1 order creation (`DODOX-YYYY-NNNNNN`), email notification. |
| `/checkout/confirmation` | `app/checkout/confirmation/page.tsx` | Client `OrderConfirmation` | `lib/orders.ts` (`localStorage`) | Retrieve order summary securely from `GET /api/orders/confirmation?ref=...&token=...` (using cryptographic confirmation/tracking token returned at checkout, falling back gracefully). |
| `/track-order` | `app/track-order/page.tsx` | Client `TrackOrderForm` | `lib/orders.ts` (`localStorage`) | Replace with `POST /api/orders/track` verifying `reference` + customer email/phone (or tracking token) with rate limiting; return real multi-stage order status & history from D1. |
| `/wishlist` | `app/wishlist/page.tsx` | Client `WishlistView` | `store/wishlist.ts` (`localStorage`), `data/products.ts` | Preserve guest-friendly Zustand wishlist; hydrate live product availability/details via API or server props without requiring customer login. |
| `/custom-atelier` | `app/custom-atelier/page.tsx` | Server page + client `CustomAtelierForm` | `data/site.ts`; form is memory-only; file previews use `URL.createObjectURL` | Upload reference attachments (up to 3 validated images) to R2/media endpoint and persist commission enquiry in `atelier_enquiries` with reference `DODOX-ATL-YYYY-NNNNNN`, rate limiting, Turnstile verification, and admin notification. |
| `/contact` | `app/contact/page.tsx` | Server page + client `ContactForm` | `data/site.ts`; form is memory-only | Persist submissions in `contact_messages`, load FAQs & showroom details from D1 `site_settings`/`faqs`, enforce rate limiting & Turnstile, notify admins. |
| `/about` | `app/about/page.tsx` | Server Component | `data/site.ts` | Connect to CMS `pages` / `site_settings` while preserving exact layout and non-invented brand copy. |
| `/journal` | `app/journal/page.tsx` | Server page + client `JournalList` | `data/journal.ts` | Load published `journal_posts` from D1. |
| `/journal/[slug]` | `app/journal/[slug]/page.tsx` | Server Component | `data/journal.ts` | Load published article and related posts from D1; return 404 for unpublished/missing slugs. |
| `/sitemap.xml` | `app/sitemap.ts` | Metadata route | `data/products.ts`, `data/journal.ts`, `data/site.ts` | Generate dynamically from published D1 products, categories, pages, and journal posts. |
| `/robots.txt` | `app/robots.ts` | Metadata route | `data/site.ts` | Disallow `/admin`, `/api`, `/cart`, `/checkout`, `/wishlist`, `/track-order`. |

---

## 4. Static Data & LocalStorage Inventory

Every location currently sourcing data from static TypeScript files or `localStorage`:

1. **`data/products.ts`** — 20 sample furniture products (`Product[]`), `productMap`, `featuredProducts`, `materialFacets`, `priceBounds`, `searchProducts`, `getRelatedProducts`, `getProductsBySlugs`. Imported by 11 files across `app/` and `components/`.
2. **`data/categories.ts`** — 5 room categories (`living-room`, `bedroom`, `dining-room`, `home-office`, `outdoor`), `categoryMap`, `curatedSpaces`. Imported by 7 files.
3. **`data/site.ts`** — `siteConfig`, `whatsappLink`, `primaryNav`, `footerNav`, `serviceFeatures`, `dodoxStandard`, `atelierWorkflow`, `timberSwatches`, `careSteps`, `demoPromoCodes` (`WELCOMEKIGALI`, `ATELIER10`), `careProtection` (65,000 RWF), `privilegeThreshold` (2,000,000 RWF). Imported by 21 files.
4. **`data/journal.ts`** — 4 `journalPosts` and 3 `testimonials`. Imported by 5 files.
5. **`data/reviews.ts`** — 8 `sampleReviews` across 4 products + `reviewHistogram`. Imported by `components/product/product-reviews.tsx`.
6. **`lib/orders.ts`** — Reads/writes `window.localStorage["dodox.orders.v1"]`. Generates random `DODO-XXXXXX` IDs in browser. **Must be replaced as authoritative store** with D1 `orders` + `order_reference_sequences` (`DODOX-2026-000001`).
7. **`store/cart.ts`** — Persists shopping bag in `window.localStorage["dodox.cart.v1"]`. **Keep for client UX**, while re-verifying all product IDs, variants, availability, coupons, care protection, VAT, and totals on the server at checkout.
8. **`store/wishlist.ts`** — Persists saved items in `window.localStorage["dodox.wishlist.v1"]`. **Keep as guest-accessible client store.**

---

## 5. Existing Business Logic & Validation Schemas

- **Currency:** `RWF` (integer Rwandan Francs; formatted via `formatRwf` in `lib/utils.ts`).
- **Variant Pricing (`lib/pricing.ts`):** Base product `price` + sum of selected option `priceDelta` values. Compare-at price scales by the same variant delta (`compareAtPrice + (unitPrice - basePrice)`).
- **Promotions (`lib/pricing.ts`, `data/site.ts`):**
  - `WELCOMEKIGALI`: Fixed 100,000 RWF discount when `subtotal >= 500,000 RWF`.
  - `ATELIER10`: 10% percentage discount on piece subtotal.
  - Seeded into D1 `coupons` marked clearly with `is_demo = 1` and admin toggleable `is_active` so business owners can review/disable before launch.
- **Care Protection:** Optional 65,000 RWF flat add-on when bag is non-empty; configurable via `site_settings`.
- **Logistics:** `kigali-white-glove` (0 RWF complimentary) vs `regional-courier` (0 RWF online; quoted manually after review); configurable in `site_settings`.
- **VAT:** Display breakdown `Math.round((total * vatRate) / (1 + vatRate))` for tax-inclusive pricing (currently 18% = 1800 bps); configurable in `site_settings` (`vat_rate_bps`, `prices_include_vat`).
- **Validation (`lib/validation.ts`):** Existing Zod v4 schemas (`checkoutSchema`, `atelierSchema`, `contactSchema`, `trackOrderSchema`, `newsletterSchema`). Reusable on both client and server, extended with item payload schemas, idempotency keys, Turnstile tokens, and admin CRUD schemas.

---

## 6. Reuse vs. Improvement vs. Preservation Matrix

### What Already Works Well (Reuse)
- Visual design system, Tailwind v4 `@theme` palette, typography (`Cormorant Garamond` + `Inter`), responsive layout, focus-trapped `Drawer`, `Accordion`, `ToastRegion`, `EmptyState`, `Skeleton`.
- Storefront component hierarchy (`Hero`, `CuratedSpaces`, `FeaturedProducts`, `CatalogView`, `FiltersPanel`, `ProductGallery`, `PurchasePanel`, `CartView`, `CartDrawer`).
- Zustand cart & wishlist stores with `skipHydration` + `StoreHydrator` (prevents SSR hydration mismatches).
- Client-side React Hook Form + Zod form primitives (`components/forms/field.tsx`).

### What Needs Real Backend & Database Persistence
- All 54 relational tables in Cloudflare D1 with versioned SQL migrations (`migrations/`).
- Seeding migration/service that imports all 20 existing products, 5 categories, collections, journal posts, testimonials, FAQs, navigation items, homepage sections, banners, coupons, RBAC roles/permissions, and placeholder site settings into D1 so the storefront renders 100% real database records out of the box.
- Authoritative server-side pricing, coupon verification, checkout order-request creation, sequential `DODOX-2026-000001` references, secure order confirmation & tracking endpoints.
- Contact, Atelier (including R2 reference image upload), and Newsletter endpoints with consent tracking, rate limiting, Turnstile support, and Resend email notifications.
- Complete `/admin` application with PBKDF2-SHA256 authentication, HTTP-only session cookies, 8 roles, granular server-enforced permissions, and all 15 operational modules.
- Root layout isolation so `/admin` renders a dedicated business operations workspace without storefront chrome (`AnnouncementBar`, `SiteHeader`, `SiteFooter`, `MobileTabBar`), while keeping every storefront route visually identical.

### What Must NOT Be Changed
- Storefront visual art direction, color tokens, fonts, spacing, and responsive breakpoints.
- Existing public URL structure (`/`, `/shop`, `/shop/[slug]`, `/cart`, `/checkout`, `/checkout/confirmation`, `/wishlist`, `/custom-atelier`, `/about`, `/contact`, `/journal`, `/journal/[slug]`, `/track-order`).
- Guest-accessible cart and wishlist UX (no forced account creation for browsing, wishlisting, or submitting an order request).
- **No online payment collection** — checkout must remain an explicit manual-confirmation order-request workflow, architected cleanly (`payment_status`, payment intent seam) for a future payment phase.
- Placeholder contact details (`concierge@dodox.rw`, `+250 788 000 000`, `KG 9 Ave, Nyarutarama, Kigali, Rwanda`) must remain configurable in Website Settings rather than replaced with invented business facts.
