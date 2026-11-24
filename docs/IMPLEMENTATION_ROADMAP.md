# DODOX Furniture — Phased Implementation Roadmap

## Execution Principles

1. **Preserve the Storefront:** Keep every public route, design token, typography choice, responsive layout, and client interaction intact while replacing static/browser-only persistence with real Cloudflare D1 + R2 server backing.
2. **Server Authority:** Never trust client-supplied prices, variant deltas, coupon discounts, VAT, or authorization flags.
3. **No Premature Payment Claims:** Release 1 implements a verified manual-confirmation order-request workflow (`unpaid_request`) with clean schema/service seams for future payment integration.
4. **Small, Tested Phases:** Verify TypeScript, lint, migrations, automated tests, and production builds as each phase completes.

---

## Phase Breakdown

### Phase 1 — Foundation, Cloudflare Infrastructure & D1 Database
- Complete repository audit and architecture documentation (`docs/`).
- Add Cloudflare Workers + OpenNext + Drizzle configuration (`wrangler.jsonc`, `open-next.config.ts`, `drizzle.config.ts`, `.dev.vars.example`, `.env.example`).
- Implement complete 54-table relational schema (`lib/server/db/schema.ts`) and initial SQL migration (`migrations/0001_initial_schema.sql`).
- Build dual-compatible D1 connection layer (`lib/server/db/client.ts`) supporting Cloudflare Workers `env.DB` binding and local SQLite D1 bridge for automated tests & CLI seeding.
- Create deterministic seed routine (`lib/server/db/seed.ts`) migrating all 20 existing DODOX products, 5 categories, collections, variants, specs, journal articles, testimonials, FAQs, navigation, banners, homepage sections, coupons, settings, and RBAC roles/permissions.
- Build core server utilities: env validation, typed safe error responses, rate limiter, CSRF check, Turnstile verifier, audit logger.

### Phase 2 — Secure Admin Authentication, RBAC & Admin Layout Shell
- Implement Web Crypto PBKDF2-SHA256 password hashing, SHA-256 session tokens, HttpOnly cookies, brute-force login rate limiting, logout, password reset token flow, and one-time `ADMIN_BOOTSTRAP_TOKEN` first-Super-Admin bootstrap.
- Implement server-side `requireAdmin` and `requirePermission` guards across all 8 roles and granular permissions (including last-Super-Admin protection).
- Isolate storefront chrome (`AnnouncementBar`, `SiteHeader`, `SiteFooter`, `MobileTabBar`, drawers) from `/admin/*` routes without altering any storefront page URL or layout.
- Build `/admin/login`, `/admin/bootstrap`, `/admin/forgot-password`, `/admin/reset-password`, and the responsive `/admin` layout shell (sidebar, mobile drawer, header, breadcrumbs, notifications, profile menu, Module 1 Dashboard KPIs).

### Phase 3 — Product, Category, Collection, Media (R2) & Storefront Catalogue Connection
- Implement R2 storage service (`lib/server/storage/r2.ts`), `/api/media/[...key]`, `/api/admin/media`, and **Module 12: Media Library**.
- Implement Product, Category, and Collection repositories, validation schemas, services, and `/api/products`, `/api/categories`, `/api/collections`, `/api/admin/products`, `/api/admin/categories`, `/api/admin/collections`.
- Build **Module 2: Product Management** (list, search/filter, create/edit full form with gallery, variants, materials, colors, dimensions, specs, care, availability, SEO) and **Module 3: Category & Collection Management**.
- Connect public storefront `/`, `/shop`, `/shop/[slug]`, `SearchOverlay`, `CartView` recommendations, and `/sitemap.xml` to live D1 data.

### Phase 4 — Server-Side Pricing, Promotions, Checkout, Order Management, Tracking & Email
- Implement centralized `pricing.service.ts` (integer RWF arithmetic, variant verification, server-side coupon engine, configurable VAT & care protection, delivery rules) and `/api/coupons/validate`.
- Implement `order.service.ts` (sequential `DODOX-YYYY-NNNNNN` references, idempotency protection, atomic `db.batch` order creation, status state machine + history, CSV export) and Resend/Queue `email/dispatcher.ts` with all 8 notification templates.
- Connect `/cart`, `/checkout`, `/checkout/confirmation`, and `/track-order` to real backend APIs (`/api/orders`, `/api/orders/confirmation`, `/api/orders/track`).
- Build **Module 4: Order Management** (`/admin/orders`, `/admin/orders/[id]`, printable order sheet, CSV export) and **Module 7: Discounts & Promotions** (`/admin/promotions`).

### Phase 5 — Inventory & Customer Management
- Implement `inventory.service.ts` (product & variant stock tracking, stock reservation on order confirmation and release on cancellation/rejection, manual adjustments, immutable movement ledger, suppliers & purchase orders) and **Module 5: Inventory Management** (`/admin/inventory`).
- Implement `customer.service.ts` (customer profiles, confirmed purchase value vs total requests, saved addresses, internal notes, activity timeline) and **Module 6: Customer Management** (`/admin/customers`, `/admin/customers/[id]`).

### Phase 6 — Enquiries, Newsletter, Content/Journal CMS & Website Settings
- Connect public `CustomAtelierForm` (with real R2 reference image upload), `ContactForm`, and `NewsletterForm` (with consent audit & unsubscribe endpoint) to D1 APIs + email notifications.
- Build **Module 8: Atelier Enquiries**, **Module 9: Contact Messages**, **Module 10: Newsletter Management** (with CSV export), **Module 11: Journal & Content Management** (articles, testimonials, banners, homepage sections, pages, FAQs, navigation), and **Module 13: Website Settings** (`/admin/settings`).
- Connect public `/journal`, `/journal/[slug]`, `/about`, `/contact`, `/custom-atelier`, `AnnouncementBar`, `SiteHeader`, and `SiteFooter` to live D1 content & settings.

### Phase 7 — Reports, Staff Governance, Audit Logs & Security Hardening
- Build **Module 14: Reports & Analytics** (`/admin/reports` with date filters, confirmed sales vs request value distinction, status distribution, product performance, inventory, customer growth, enquiry volume, coupon usage, CSV exports).
- Build **Module 15: Staff Management & Audit Logs** (`/admin/staff` with role assignment, activation controls, last-Super-Admin protection, and searchable `activity_logs`).
- Add security headers (`CSP`-friendly `X-Content-Type-Options`, `X-Frame-Options` safe for preview, `Referrer-Policy`), input sanitization verification, and performance polish.

### Phase 8 — Automated Test Suite, Build Verification & Cloudflare Readiness
- Execute comprehensive automated test suites: pricing unit tests, validation unit tests, authentication & RBAC authorization tests, database migration & seed tests, checkout & order status workflow tests, product/inventory management API tests, and end-to-end HTTP flow tests.
- Run `npm run typecheck`, `npm run lint`, `npm run verify`, `npm test`, Wrangler local D1 migration checks, `npm run build` (Next.js production build), and OpenNext Cloudflare build check.
- Update `docs/PROGRESS.md` and `README.md` with honest completion reporting and owner setup steps.
