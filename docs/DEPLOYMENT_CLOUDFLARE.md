# DODOX Furniture — Cloudflare Deployment & Infrastructure Guide

## 1. Target Architecture on Cloudflare

| Component | Cloudflare Service | Binding Name in `wrangler.jsonc` |
| --- | --- | --- |
| Full-stack Next.js 15.5 App + API | **Cloudflare Workers** (`@opennextjs/cloudflare`) | `WORKER_SELF_REFERENCE`, `ASSETS` |
| Primary Relational Database | **Cloudflare D1** (SQLite) | `DB` |
| Product & Enquiry Media Storage | **Cloudflare R2** | `MEDIA_BUCKET` |
| Optional Edge Cache | **Cloudflare Workers KV** | `CACHE_KV` (optional) |
| Background Email Dispatch | **Cloudflare Queues** + **Resend API** | `NOTIFICATION_QUEUE` (optional; falls back to direct async `fetch`) |
| Public Form Bot Protection | **Cloudflare Turnstile** | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` |
| Edge Security | **Cloudflare DNS + SSL/TLS + WAF** | Configured in Cloudflare Dashboard |

> **Important Security Note:** No Cloudflare account IDs, D1 `database_id`s, R2 credentials, or API secrets have been invented or committed to this repository. Placeholders in `wrangler.jsonc` are explicitly marked `<REPLACE_WITH_...>` so the project owner supplies verified values during provisioning.

---

## 2. Local Development Setup

### Prerequisites
- Node.js `22.x` (`>= 20.9.0`)
- npm `10+`

### Step-by-Step Local Start
```bash
# 1. Install dependencies
npm install

# 2. Copy local environment templates
cp .env.example .env.local
cp .dev.vars.example .dev.vars
# Edit .env.local / .dev.vars to set a strong ADMIN_BOOTSTRAP_TOKEN (min 24 chars)
# and SESSION_SECRET (min 32 chars).

# 3. Apply D1 SQL migrations to the local Wrangler D1 SQLite database
npm run db:migrate:local

# 4. Seed the existing DODOX catalogue, categories, journal, settings, and RBAC roles
npm run db:seed:local

# 5. Start Next.js development server (with OpenNext Cloudflare local bindings)
npm run dev
```

### Bootstrapping the First Super Admin Locally
1. Visit `http://localhost:3000/admin/bootstrap` (only active while zero staff users exist in D1).
2. Enter your `ADMIN_BOOTSTRAP_TOKEN`, your name, email, and a strong password (minimum 12 characters).
3. Once created, `/admin/bootstrap` permanently locks itself (`403 Forbidden`), and you are signed in to `/admin`.

---

## 3. Production Provisioning on Cloudflare (Owner Checklist)

Authenticate Wrangler with your Cloudflare account:
```bash
npx wrangler login
```

### Step 1 — Create Production & Staging D1 Databases
```bash
npx wrangler d1 create dodox-furniture-prod
npx wrangler d1 create dodox-furniture-preview
```
Copy each returned `database_id` into `wrangler.jsonc` under `d1_databases` (and `env.production.d1_databases`).

### Step 2 — Create R2 Media Bucket
```bash
npx wrangler r2 bucket create dodox-furniture-media-prod
npx wrangler r2 bucket create dodox-furniture-media-preview
```
Verify the `bucket_name` entries in `wrangler.jsonc` match your created buckets.  
*(Media uploads are served securely through `/api/media/[...key]` with immutable `Cache-Control` headers, or optionally via a Cloudflare R2 Custom Domain set in `NEXT_PUBLIC_MEDIA_BASE_URL`.)*

### Step 3 — (Optional) Create KV Namespace & Notification Queue
```bash
npx wrangler kv namespace create CACHE_KV
npx wrangler queues create dodox-notifications-prod
```

### Step 4 — Configure Production Secrets (Never Commit These)
```bash
npx wrangler secret put SESSION_SECRET --env production
npx wrangler secret put ADMIN_BOOTSTRAP_TOKEN --env production
npx wrangler secret put RESEND_API_KEY --env production
npx wrangler secret put TURNSTILE_SECRET_KEY --env production
```

Set public non-secret variables in `wrangler.jsonc` (`env.production.vars`):
- `NEXT_PUBLIC_SITE_URL`: e.g. `https://dodox.rw`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Your Cloudflare Turnstile site key
- `EMAIL_FROM`: Verified Resend sender e.g. `DODOX Atelier <concierge@dodox.rw>`
- `ADMIN_NOTIFICATION_EMAIL`: Concierge inbox receiving new order/enquiry alerts

### Step 5 — Apply Migrations & Seed Initial Catalogue in Production
```bash
# Apply versioned SQL migrations to remote production D1
npm run db:migrate:prod

# Optional: Seed initial DODOX RBAC roles, settings, and starter catalogue
npm run db:seed:prod
```

### Step 6 — Build & Deploy to Cloudflare Workers
```bash
# Compiles Next.js via @opennextjs/cloudflare and deploys Worker + static assets
npm run cf:deploy:prod
```

### Step 7 — Complete First-Time Admin Setup & Business Verification
1. Visit `https://<your-domain>/admin/bootstrap` immediately after deployment and create the initial **Super Admin** account using `ADMIN_BOOTSTRAP_TOKEN`.
2. Rotate or remove `ADMIN_BOOTSTRAP_TOKEN` via `npx wrangler secret delete ADMIN_BOOTSTRAP_TOKEN --env production` if desired (bootstrap is also permanently disabled in code once a user exists).
3. In `/admin/settings`, verify and update:
   - Official company telephone, WhatsApp number, email, and showroom hours.
   - Applicable Rwanda VAT rate (`vat_rate_bps`) confirmed with your tax advisor.
4. In `/admin/promotions`, deactivate or delete demonstration promo codes (`WELCOMEKIGALI`, `ATELIER10`) before public launch unless intentionally offered.

---

## 4. DNS, SSL/TLS, WAF & Rate Limiting Recommendations

1. **Custom Domain:** In Cloudflare Dashboard -> *Workers & Pages -> dodox-furniture -> Settings -> Domains & Routes*, attach `dodox.rw` and `www.dodox.rw` (Cloudflare automatically provisions edge SSL certificates).
2. **SSL/TLS:** Set encryption mode to **Full (strict)**, enable **Always Use HTTPS**, **Minimum TLS Version 1.2**, and **HSTS**.
3. **Cloudflare WAF Managed Rules:** Enable *Cloudflare Managed Ruleset* and *Cloudflare OWASP Core Ruleset*.
4. **Edge Rate Limiting Rules (Defense-in-depth alongside D1 application rate limiting):**
   - `POST /api/admin/auth/login`: max 10 requests / 5 minutes per IP.
   - `POST /api/orders`, `POST /api/enquiries/*`, `POST /api/newsletter`: max 15 requests / 5 minutes per IP.
   - `/admin/*`: Optionally place behind Cloudflare Access (Zero Trust) for staff IP/SSO hardening.

---

## 5. Backup, Export & Disaster Recovery Plan

1. **D1 Time Travel:** Cloudflare D1 automatically retains point-in-time recovery (up to 30 days on Workers Paid plan). Restore any timestamp via:
   ```bash
   npx wrangler d1 time-travel restore dodox-furniture-prod --timestamp="2026-11-24T00:00:00Z"
   ```
2. **Scheduled Logical SQL Exports:** Run weekly logical dumps in CI/ops:
   ```bash
   npx wrangler d1 export dodox-furniture-prod --remote --output=backup-$(date +%F).sql
   ```
3. **R2 Object Durability:** Enable R2 Object Versioning / lifecycle retention in Cloudflare Dashboard to prevent accidental media overwrites.
4. **CSV Operational Exports:** Orders, newsletter subscribers, and analytics reports can be exported directly to CSV from `/admin/orders`, `/admin/newsletter`, and `/admin/reports`.

---

## 6. Post-Deployment Smoke Test Checklist

- [ ] `GET /` renders homepage with featured products, curated rooms, journal, and announcement banner from D1.
- [ ] `GET /shop` filters by category, collection, material, color, availability, and price; `/shop/[slug]` renders live variant pricing.
- [ ] Submitting `/checkout` creates `DODOX-2026-000001` in D1, displays confirmation without collecting payment, and `/track-order` retrieves status only with matching email/phone.
- [ ] Submitting `/contact`, `/custom-atelier` (with image upload to R2), and newsletter persists records in D1 and creates admin notifications.
- [ ] Unauthenticated `GET /admin` redirects to `/admin/login`; `GET /api/admin/orders` returns `401 Unauthorized`.
- [ ] Signing in to `/admin` displays real KPI metrics, allows status updates on orders (recording `order_status_history`), stock adjustments, product edits, and writes `activity_logs`.
