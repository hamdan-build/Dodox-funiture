# DODOX Furniture — System Architecture

## 1. Architectural Overview

DODOX Furniture is architected as a **Cloudflare-first, monolithic full-stack Next.js 15.5 application** compiled for the Cloudflare Workers runtime via **OpenNext for Cloudflare (`@opennextjs/cloudflare`)**.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           Cloudflare Edge Network                          │
│  DNS · SSL/TLS · WAF · Edge Rate Limiting · Turnstile Bot Verification     │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                Cloudflare Worker (Next.js 15.5 via OpenNext)               │
│                                                                            │
│  ┌─────────────────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│  │ Public Storefront (SSR) │  │ Private /admin UI │  │  /app/api/*      │  │
│  │ /, /shop, /checkout...  │  │ RBAC Workspace    │  │  REST JSON APIs  │  │
│  └────────────┬────────────┘  └─────────┬─────────┘  └────────┬─────────┘  │
│               └─────────────────────────┼─────────────────────┘            │
│                                         ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     lib/server/* Backend Core                        │  │
│  │  Validation (Zod) -> Auth & RBAC -> Services (Pricing, Orders,       │  │
│  │  Inventory, Catalogue, Content, Reports) -> Repositories -> Drizzle  │  │
│  └──────┬───────────────────────┬──────────────────────┬────────────────┘  │
└─────────┼───────────────────────┼──────────────────────┼───────────────────┘
          │                       │                      │
          ▼                       ▼                      ▼
┌───────────────────┐   ┌───────────────────┐  ┌─────────────────────────────┐
│   Cloudflare D1   │   │   Cloudflare R2   │  │ Cloudflare Queues / Resend  │
│ Relational SQLite │   │  Product & Media  │  │ Async Transactional Emails  │
│ (54 Tables, Acid) │   │   Object Bucket   │  │ & Scheduled Maintenance     │
└───────────────────┘   └───────────────────┘  └─────────────────────────────┘
```

---

## 2. Cloudflare Service Mapping

| Capability | Primary Technology | Runtime Binding / Mechanism | Local / Test Fallback |
| --- | --- | --- | --- |
| Application Hosting & SSR | Cloudflare Workers + `@opennextjs/cloudflare` | `WORKER_SELF_REFERENCE`, `ASSETS` | `next dev` with `initOpenNextCloudflareForDev()` / `opennextjs-cloudflare preview` |
| Relational Database | Cloudflare D1 (SQLite) | `env.DB` (`D1Database`) via `drizzle-orm/d1` | Local Wrangler D1 SQLite state (`.wrangler/state`) & `node:sqlite` D1 adapter for automated test suite |
| Schema & Migrations | Drizzle ORM + versioned SQL in `migrations/` | `wrangler d1 migrations apply` | Automated SQL migration runner in tests & dev bootstrap |
| Media & File Uploads | Cloudflare R2 | `env.MEDIA_BUCKET` (`R2Bucket`), served via `/api/media/[...key]` or custom R2 public domain | Local filesystem/R2 Miniflare bucket in development |
| Caching | Cloudflare Cache API / Optional KV | `env.CACHE_KV` (`KVNamespace`) + Next.js `revalidatePath` | Graceful no-op cache fallback when KV binding is absent |
| Background Notifications | Cloudflare Queues + Resend HTTP API | `env.NOTIFICATION_QUEUE` (`Queue`) -> HTTP `fetch` to Resend | Direct non-blocking `fetch` retry with structured logging when Queue/API key is unset |
| Scheduled Maintenance | Cloudflare Cron Triggers | Scheduled cleanup of expired sessions, reset tokens, and rate-limit buckets | `/api/admin/maintenance/cleanup` & lazy cleanup on auth operations |
| Bot Protection | Cloudflare Turnstile | Server-side `siteverify` check in `lib/server/security/turnstile.ts` | Passes cleanly in development when `TURNSTILE_SECRET_KEY` is not configured; strictly enforced when configured |

---

## 3. Backend Layered Architecture (`lib/server/`)

To prevent business rules or database queries from leaking into React components or thin route handlers, all server code follows strict separation of concerns:

```
lib/server/
├── env.ts                     # Runtime binding & env resolution (Cloudflare Context + process.env validation)
├── errors.ts                  # Typed AppError hierarchy + safe HTTP response serializer (never leaks stack traces)
├── http.ts                    # Consistent JSON response helpers, request IP/UA extraction, CSRF origin check
├── db/
│   ├── schema.ts              # Complete Drizzle ORM D1 schema (54 tables + relations)
│   ├── client.ts              # Resolves Drizzle client from Cloudflare D1 binding or local SQLite D1 bridge
│   └── seed-data.ts           # Deterministic D1 seed routine migrating existing DODOX catalogue & content
├── auth/
│   ├── password.ts            # Web Crypto PBKDF2-SHA256 (100,000 iterations, random 128-bit salt, constant-time verify)
│   ├── session.ts             # SHA-256 hashed session tokens, HttpOnly/Secure/SameSite=Lax cookies, expiry & rotation
│   ├── rbac.ts                # 8 roles, granular permission matrix, server-side requireAdmin / requirePermission guards
│   └── bootstrap.ts           # One-time token-gated first Super Admin bootstrap (no default credentials)
├── security/
│   ├── rate-limit.ts          # D1-backed sliding/fixed window rate limiter (safe across stateless Worker isolates)
│   ├── turnstile.ts           # Cloudflare Turnstile verification
│   ├── csrf.ts                # Origin / Referer + custom header verification for cookie-authenticated mutations
│   └── sanitize.ts            # Text normalization, filename sanitization, magic-byte image inspection
├── validation/
│   ├── public.ts              # Checkout, tracking, coupon check, contact, atelier, newsletter Zod schemas
│   └── admin.ts               # Product, category, collection, order, inventory, customer, coupon, content, settings, staff Zod schemas
├── repositories/              # Pure D1 data-access queries
│   ├── catalogue.repo.ts
│   ├── orders.repo.ts
│   ├── inventory.repo.ts
│   ├── customers.repo.ts
│   ├── promotions.repo.ts
│   ├── enquiries.repo.ts
│   ├── content.repo.ts
│   ├── settings.repo.ts
│   ├── media.repo.ts
│   ├── auth.repo.ts
│   └── audit.repo.ts
├── services/                  # Authoritative domain & business rules
│   ├── pricing.service.ts     # Server-side RWF pricing, variant deltas, coupon rules, care protection, VAT, logistics
│   ├── order.service.ts       # Sequential DODOX-YYYY-NNNNNN ref, atomic D1 batch creation, status machine, CSV export
│   ├── inventory.service.ts   # Stock tracking, reservations on confirmation, manual adjustments, movement ledger
│   ├── catalogue.service.ts   # Storefront & admin product/category/collection mapping to existing frontend types
│   ├── customer.service.ts    # Customer profile upsert, confirmed spend aggregation, notes & addresses
│   ├── enquiry.service.ts     # Atelier commissions, contact messages, newsletter double-record consent & CSV export
│   ├── content.service.ts     # Journal, testimonials, pages, homepage sections, banners, FAQs, navigation, settings
│   ├── reports.service.ts     # Period metrics, confirmed sales vs request value, status breakdown, top products, CSVs
│   └── audit.service.ts       # Admin activity logs & in-app notifications
├── storage/
│   └── r2.ts                  # R2 upload, MIME & magic-byte validation, size limits, media retrieval & deletion
└── email/
    ├── templates.ts           # Editorial HTML + plain-text templates for all 8 customer & admin events
    └── dispatcher.ts          # Resend API + Queue producer with graceful error isolation (never fails order creation)
```

---

## 4. Critical Data Flows

### 4.1 Checkout & Order-Request Flow (No Online Payment)
1. Customer configures pieces in browser (`useCartStore`) and submits `/checkout`.
2. Client sends `POST /api/orders` containing customer contact/address, `items: [{ productId, slug, quantity, selections }]`, `promoCode`, `careProtection`, `idempotencyKey`, and optional `turnstileToken`. **Client-computed prices are ignored.**
3. Server validates payload with Zod, checks rate limit & Turnstile, and checks `idempotencyKey` to prevent duplicate submissions.
4. `pricing.service.ts` loads published products and variant options from D1, verifies availability (`out-of-stock` items rejected; `in-stock` quantities checked against available stock), computes exact unit prices (`base_price + sum(option.price_delta)`), validates coupon active window, minimum subtotal, global usage limit, and per-customer email limit, applies care protection and VAT configuration from `site_settings`.
5. `order.service.ts` increments `order_reference_sequences` for the current UTC year to produce `DODOX-2026-000001`, generates a cryptographic `tracking_token` (storing only its SHA-256 hash), upserts the `customers` record, and executes an atomic `db.batch([...])` inserting `orders`, `order_addresses`, `order_items`, `order_status_history` (`received`), `coupon_redemptions` (if applicable), and an admin `notifications` row.
6. Inventory is **not** decremented on unconfirmed `received` requests; stock reservation/deduction occurs when an authorized admin transitions the order to `confirmed` (and releases if `cancelled`/`rejected`), per configured business workflow.
7. `email/dispatcher.ts` dispatches customer confirmation and admin alert emails asynchronously; failures are logged without rolling back the persisted order.
8. Client clears cart and redirects to `/checkout/confirmation?ref=DODOX-2026-000001&token=<trackingToken>`.

### 4.2 Secure Customer Order Tracking
- Predictable sequential references (`DODOX-2026-000001`) are protected against IDOR enumeration:
  - `/checkout/confirmation` requires matching `ref` + cryptographic `token`.
  - `/track-order` (`POST /api/orders/track`) requires `ref` + matching customer email or normalized phone number, guarded by IP + reference rate limiting, returning only customer-safe status history and order lines.

### 4.3 Future Payment Integration Seam
- `orders` includes `payment_status` (`not_applicable` | `unpaid_request` | `pending_payment` | `paid` | `refunded`), `payment_provider`, and `payment_reference` columns (defaulting to `'unpaid_request'` and `NULL`).
- Reports and Dashboard KPIs strictly separate **Unpaid Order Request Value** (`received`, `under_review`) from **Confirmed Order Value** (`confirmed`, `in_production`, `ready`, `out_for_delivery`, `delivered`). No payment UI or fake gateway exists anywhere in Release 1.
