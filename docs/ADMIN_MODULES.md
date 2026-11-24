# DODOX Furniture — Admin Dashboard & RBAC Specification

## 1. Security & Role-Based Access Control (RBAC)

All `/admin/*` pages (except `/admin/login`, `/admin/forgot-password`, `/admin/reset-password`, and one-time `/admin/bootstrap`) and all `/api/admin/*` routes enforce server-side session authentication and granular permission checks.

### 1.1 Roles (8 Built-in Roles)

| Role | Slug | Intended Responsibility | Default Permissions |
| --- | --- | --- | --- |
| **Super Admin** | `super_admin` | Full platform ownership & staff governance | `*` (All permissions; protected against last-Super-Admin self-demotion/deactivation) |
| **Administrator** | `administrator` | Day-to-day business administration | All operational modules including settings, reports, staff viewing, content, orders, products, inventory |
| **Store Manager** | `store_manager` | Showroom & commercial operations | `products.*`, `categories.manage`, `orders.*`, `inventory.manage`, `customers.*`, `promotions.manage`, `enquiries.manage`, `reports.read` |
| **Product Manager** | `product_manager` | Catalogue, variants, pricing & media | `products.read`, `products.create`, `products.update`, `products.delete`, `categories.manage`, `media.manage` |
| **Inventory Manager** | `inventory_manager` | Stock counts, adjustments, suppliers & POs | `products.read`, `inventory.manage`, `reports.read` |
| **Order Manager** | `order_manager` | Order-request review, confirmation & delivery | `orders.read`, `orders.update`, `orders.export`, `customers.read`, `customers.update`, `inventory.manage` |
| **Content Editor** | `content_editor` | Journal, homepage, banners, FAQs & media | `content.manage`, `media.manage`, `products.read` |
| **Customer Support** | `customer_support` | Concierge enquiries, contact & order lookup | `orders.read`, `customers.read`, `customers.update`, `enquiries.manage` |

### 1.2 First-Admin Bootstrap Procedure
- No hardcoded or default admin credentials exist in migrations or seed files.
- When `users` count is `0`, `/admin/bootstrap` (`POST /api/admin/auth/bootstrap`) accepts creation of the initial `Super Admin` **only if** the caller supplies the valid `ADMIN_BOOTSTRAP_TOKEN` environment secret (compared in constant time).
- Once at least one Super Admin exists, the bootstrap endpoint permanently returns `403 Forbidden`.
- A CLI helper (`npm run db:bootstrap-admin`) is also documented for local/Wrangler setup.

---

## 2. Admin Shell & UX Design

- **Visual Direction:** Warm operational precision — grounded in DODOX's `ivory` (`#f7f2e8`), `parchment` (`#fbf8f1`), `ink` (`#221e19`), and `bronze` (`#7e5f3c`) palette, optimized with crisp tabular numerals, high-density data tables, sticky headers, keyboard-friendly search, status badges, confirmation modals, empty states, loading skeletons, and toast feedback.
- **Navigation Shell:**
  - Collapsible desktop sidebar + mobile slide-over drawer grouped into *Overview*, *Commerce*, *Client Relations*, *Editorial & Site*, and *Administration*.
  - Top bar with dynamic breadcrumbs, global quick search (orders, products, customers, enquiries), unread notification bell popover, quick "View Storefront" link, and staff profile menu with role badge and logout.

---

## 3. The 15 Admin Modules

1. **Module 1 — Executive Dashboard (`/admin`)**
   - Real-time D1 KPIs: Confirmed Order Value (RWF) clearly separated from Unpaid Order-Request Pipeline Value (RWF), Total Orders, Pending Review (`received` + `under_review`), In Production, Ready for Delivery, Total Customers, Published Products, Low-Stock Alerts.
   - Interactive tables/feeds for Recent Order Requests, Recent Atelier & Contact Enquiries, Top-Requested/Confirmed Pieces, and Period Trend Breakdown.

2. **Module 2 — Product Management (`/admin/products`, `/admin/products/new`, `/admin/products/[id]`)**
   - Full CRUD, publish/unpublish/archive controls, slug auto-generation & collision check, base & compare-at RWF integer pricing, availability (`in-stock`, `made-to-order`, `pre-order`, `out-of-stock`), lead times, featured toggle, badge, seating capacity.
   - Multi-image gallery manager (R2 upload + Media Library picker + primary/reorder), dynamic Variant Option Groups & Option Values (with RWF `priceDelta` & color swatch), colors, materials, dimensions, craft specifications, care instructions, category & collection assignment, and SEO metadata.

3. **Module 3 — Category & Collection Management (`/admin/categories`)**
   - Tabbed/unified management for Categories (name, short name, slug, tagline, description, parent category, cover image, display sort order, publish status) and Collections (*Imanzi Series*, etc., with assigned product counts and publish/featured controls).

4. **Module 4 — Order-Request Management (`/admin/orders`, `/admin/orders/[id]`)**
   - Search by `DODOX-YYYY-NNNNNN` reference, customer name, email, or phone; filter by status (`received`, `under_review`, `confirmed`, `in_production`, `ready`, `out_for_delivery`, `delivered`, `cancelled`, `rejected`) and date range.
   - Detail view: customer & Kigali/regional delivery details, verified item & variant breakdown, pricing/discount/care/VAT summary, status transition workflow (with optional customer-visible note & automatic stock reservation/release), immutable status timeline, internal concierge notes, print-formatted order sheet, and CSV export (`/api/admin/orders/export`).

5. **Module 5 — Inventory Management (`/admin/inventory`)**
   - Product & variant stock levels (`on_hand`, `reserved`, `available = on_hand - reserved`, `low_stock_threshold`), low-stock filter, manual stock adjustment modal (`set`, `increment`, `decrement`, `damage`, `recount`) with mandatory reason, immutable `inventory_movements` ledger, plus Suppliers & Purchase Orders management.

6. **Module 6 — Customer Management (`/admin/customers`, `/admin/customers/[id]`)**
   - Searchable customer directory showing order count, confirmed order count, and confirmed RWF purchase value.
   - Customer profile with contact details, saved delivery addresses, full order-request history, activity timeline, and internal concierge notes.

7. **Module 7 — Discounts & Promotions (`/admin/promotions`)**
   - Coupon CRUD (`fixed` RWF or `percent` discount, minimum subtotal, maximum discount cap, active dates, total usage cap, per-customer cap, active/inactive toggle, demo badge for `WELCOMEKIGALI` & `ATELIER10`) + storewide promotional campaigns & redemption history.

8. **Module 8 — Atelier Enquiries (`/admin/enquiries/atelier`)**
   - Commission brief queue with full specifications (piece type, room/piece dimensions, material, finish, budget, contact preference, uploaded R2 reference images), quoted amount recording, status workflow (`new` -> `reviewing` -> `quotation_prepared` -> `awaiting_customer` -> `accepted` -> `in_production` -> `completed` / `rejected`), internal notes, direct mailto/tel/WhatsApp concierge actions, and archiving.

9. **Module 9 — Contact Messages (`/admin/enquiries/contact`)**
   - Inbox with search, read/unread toggle, status (`new`, `open`, `replied`, `archived`), subject & message viewer, internal notes, and archive controls.

10. **Module 10 — Newsletter Management (`/admin/newsletter`)**
    - Subscriber directory, active/unsubscribed filter, explicit consent timestamp & source audit, manual unsubscribe/status management, duplicate-safe handling, and RFC-compliant CSV export (`/api/admin/newsletter/export`).

11. **Module 11 — Journal & Content Management (`/admin/content`)**
    - Complete CRUD with draft/publish controls across:
      - Journal Articles (structured heading/paragraph/quote block editor + metadata)
      - Homepage Sections & Promotional/Announcement Banners
      - Collector Testimonials (with sample-content indicator)
      - Static Pages, FAQs, and Header/Footer Navigation Items.

12. **Module 12 — Media Library (`/admin/media`)**
    - Cloudflare R2 file upload (drag-and-drop / file picker), server-side MIME + magic-byte signature validation (`JPEG`, `PNG`, `WebP`, `AVIF`), 8 MB file size limit, alt-text & folder metadata editing, preview grid, product assignment lookup, and safe deletion.

13. **Module 13 — Website Settings (`/admin/settings`)**
    - Manage store name, logo URL, contact email, phone, WhatsApp number, Nyarutarama showroom address & hours, Instagram/Pinterest links, currency (`RWF`), VAT rate (basis points, clearly marked for owner legal verification), care protection fee, Kigali white-glove privilege threshold & delivery notes, order reference prefix (`DODOX`), SEO defaults, and announcement bar copy.

14. **Module 14 — Reports & Analytics (`/admin/reports`)**
    - Date-filtered analytics clearly separating **Confirmed Order Value** from **Unpaid Request Pipeline Value** (zero fabricated paid revenue), order status distribution, product performance table, low-stock & inventory valuation summary, customer acquisition growth, enquiry volume, coupon redemption metrics, and downloadable CSV exports.

15. **Module 15 — Staff Management & Audit Logs (`/admin/staff`)**
    - Create staff accounts, assign one or more RBAC roles, activate/deactivate accounts, reset passwords, enforce "cannot remove or deactivate the last active Super Admin" invariant, and inspect filterable `activity_logs` across all admin mutations.
