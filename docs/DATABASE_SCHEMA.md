# DODOX Furniture — Relational Database Schema (Cloudflare D1)

## 1. Conventions & Monetary Precision

- **Engine:** Cloudflare D1 (SQLite 3.x with `PRAGMA foreign_keys = ON`).
- **Primary Keys:** Prefixed ULID/UUID text identifiers (`usr_...`, `prd_...`, `ord_...`) or deterministic slugs/keys where natural.
- **Timestamps:** ISO-8601 UTC strings (`YYYY-MM-DDTHH:mm:ss.sssZ`) stored as `TEXT NOT NULL`.
- **Monetary Values:** Stored strictly as **64-bit integers (`INTEGER NOT NULL`) in Rwandan Francs (RWF)**. Floating-point types (`REAL`, `FLOAT`) are never used for prices, discounts, taxes, or totals. Percentage rates (such as VAT) are stored in **basis points (`INTEGER`, e.g. `1800` = `18.00%`)**.
- **Atomicity on D1:** Multi-statement mutations use D1's native `db.batch([...])` API, which Cloudflare D1 executes inside an implicit SQLite transaction with automatic rollback on failure.
- **Migrations:** Version-controlled SQL files under `migrations/`, generated and verified against `lib/server/db/schema.ts` (`drizzle.config.ts`).

---

## 2. Complete Table Catalogue (54 Tables)

### Domain A — Authentication, RBAC & Staff (8 Tables)

1. **`users`** — Staff/admin accounts (`id`, `email` UNIQUE, `password_hash`, `password_salt`, `first_name`, `last_name`, `phone`, `avatar_url`, `is_active`, `must_change_password`, `last_login_at`, `created_at`, `updated_at`).
2. **`roles`** — System & custom roles (`id`, `slug` UNIQUE, `name`, `description`, `is_system`, `created_at`). Seeded with:
   - `super_admin`, `administrator`, `store_manager`, `product_manager`, `inventory_manager`, `order_manager`, `content_editor`, `customer_support`.
3. **`permissions`** — Atomic permission keys (`id`, `key` UNIQUE, `module`, `description`). Covers `products.*`, `categories.*`, `orders.*`, `inventory.manage`, `customers.*`, `promotions.manage`, `enquiries.manage`, `content.manage`, `media.manage`, `settings.manage`, `staff.manage`, `reports.read`.
4. **`user_roles`** — Junction (`user_id` FK -> `users.id` CASCADE, `role_id` FK -> `roles.id` CASCADE, `assigned_by`, `assigned_at`, UNIQUE `(user_id, role_id)`).
5. **`role_permissions`** — Junction (`role_id` FK -> `roles.id` CASCADE, `permission_id` FK -> `permissions.id` CASCADE, UNIQUE `(role_id, permission_id)`).
6. **`sessions`** — Server-side admin sessions (`id`, `user_id` FK -> `users.id` CASCADE, `token_hash` UNIQUE, `ip_hash`, `user_agent`, `expires_at`, `last_seen_at`, `revoked_at`, `created_at`). Indexed on `token_hash`, `user_id`, `expires_at`.
7. **`password_reset_tokens`** — One-time reset tokens (`id`, `user_id` FK -> `users.id` CASCADE, `token_hash` UNIQUE, `expires_at`, `used_at`, `created_at`).
8. **`login_attempts`** — Brute-force audit & lockout tracking (`id`, `email`, `ip_hash`, `succeeded`, `reason`, `created_at`). Indexed on `(email, created_at)` and `(ip_hash, created_at)`.

---

### Domain B — Products & Catalogue (13 Tables)

9. **`categories`** — Hierarchical room/furniture categories (`id`, `slug` UNIQUE, `parent_id` self-FK, `name`, `short_name`, `tagline`, `description`, `image_url`, `image_alt`, `sort_order`, `is_published`, `seo_title`, `seo_description`, `created_at`, `updated_at`).
10. **`collections`** — Design series e.g. *Imanzi Series* (`id`, `slug` UNIQUE, `name`, `tagline`, `description`, `hero_image_url`, `hero_image_alt`, `sort_order`, `is_featured`, `is_published`, `created_at`, `updated_at`).
11. **`products`** — Core piece record (`id`, `slug` UNIQUE, `sku` UNIQUE, `name`, `subtitle`, `description`, `story`, `category_id` FK -> `categories.id`, `collection_id` FK -> `collections.id`, `base_price` INTEGER, `compare_at_price` INTEGER, `availability` (`in-stock` | `made-to-order` | `pre-order` | `out-of-stock`), `lead_time`, `featured` INTEGER, `badge`, `rating_tenths` INTEGER, `review_count` INTEGER, `seating` INTEGER, `dimensions_json` TEXT, `care_json` TEXT, `seo_title`, `seo_description`, `status` (`draft` | `published` | `archived`), `sort_order`, `created_at`, `updated_at`). Indexed on `slug`, `category_id`, `collection_id`, `status`, `featured`, `availability`, `base_price`.
12. **`product_categories`** — Multi-category assignments (`product_id` FK, `category_id` FK, `is_primary`, `sort_order`, PRIMARY KEY `(product_id, category_id)`).
13. **`product_images`** — Ordered product gallery (`id`, `product_id` FK CASCADE, `media_id` FK -> `media_assets.id` SET NULL, `url`, `alt_text`, `sort_order`, `is_primary`, `created_at`).
14. **`product_options`** — Configurable option groups e.g. *Upholstery*, *Dimensions & Scale*, *Plinth Base* (`id`, `product_id` FK CASCADE, `option_key`, `label`, `helper_text`, `sort_order`, UNIQUE `(product_id, option_key)`).
15. **`product_option_values`** — Selectable values within an option group (`id`, `option_id` FK -> `product_options.id` CASCADE, `product_id` FK CASCADE, `value_key`, `label`, `helper_text`, `price_delta` INTEGER, `swatch_hex`, `lead_time_override`, `is_available`, `sort_order`, UNIQUE `(option_id, value_key)`).
16. **`product_variants`** — Concrete SKU variants for variant-level stock & pricing overrides (`id`, `product_id` FK CASCADE, `sku` UNIQUE, `title`, `option_values_json`, `price_override` INTEGER, `price_delta` INTEGER, `availability_override`, `lead_time_override`, `is_active`, `created_at`, `updated_at`).
17. **`product_tags`** — Normalized tags (`id`, `slug` UNIQUE, `name`).
18. **`product_tag_relations`** — Junction (`product_id` FK CASCADE, `tag_id` FK CASCADE, PRIMARY KEY `(product_id, tag_id)`).
19. **`product_specifications`** — Craft specs, dimensions, and care rows (`id`, `product_id` FK CASCADE, `group_type` (`spec` | `dimension` | `care`), `label`, `value`, `sort_order`).
20. **`product_materials`** — Piece materials (`id`, `product_id` FK CASCADE, `name`, `sort_order`). Indexed on `name` for catalogue filtering.
21. **`product_colors`** — Piece color swatches (`id`, `product_id` FK CASCADE, `name`, `hex`, `sort_order`).

---

### Domain C — Inventory & Procurement (5 Tables)

22. **`inventory`** — Current stock record per product or variant (`id`, `product_id` FK CASCADE, `variant_id` FK -> `product_variants.id` CASCADE, `sku`, `quantity_on_hand` INTEGER, `quantity_reserved` INTEGER, `low_stock_threshold` INTEGER, `allow_backorder` INTEGER, `warehouse_location`, `updated_at`, UNIQUE `(product_id, variant_id)`).
23. **`inventory_movements`** — Immutable stock ledger (`id`, `inventory_id` FK CASCADE, `product_id` FK, `variant_id` FK, `movement_type` (`initial_seed` | `manual_adjustment` | `order_reserved` | `order_released` | `order_fulfilled` | `purchase_received`), `quantity_delta` INTEGER, `previous_on_hand` INTEGER, `new_on_hand` INTEGER, `previous_reserved` INTEGER, `new_reserved` INTEGER, `reference_type`, `reference_id`, `reason`, `actor_user_id` FK -> `users.id`, `created_at`).
24. **`stock_adjustments`** — Explicit admin stock correction records (`id`, `adjustment_reference` UNIQUE, `inventory_id` FK, `product_id` FK, `variant_id` FK, `adjustment_type` (`set` | `increment` | `decrement` | `damage` | `recount`), `quantity_before` INTEGER, `quantity_change` INTEGER, `quantity_after` INTEGER, `reason`, `notes`, `created_by_user_id` FK, `created_at`).
25. **`suppliers`** — Timber, textile, and hardware suppliers (`id`, `name`, `code` UNIQUE, `contact_name`, `email`, `phone`, `city`, `country`, `materials_supplied`, `notes`, `is_active`, `created_at`, `updated_at`).
26. **`purchase_orders`** — Supplier procurement records (`id`, `po_number` UNIQUE, `supplier_id` FK -> `suppliers.id`, `status` (`draft` | `ordered` | `partially_received` | `received` | `cancelled`), `currency`, `total_amount` INTEGER, `expected_at`, `received_at`, `items_json`, `notes`, `created_by_user_id` FK, `created_at`, `updated_at`).

---

### Domain D — Orders & Order-Request Processing (6 Tables)

27. **`order_reference_sequences`** — Atomic per-year counter (`year` INTEGER PRIMARY KEY, `prefix` TEXT NOT NULL DEFAULT `'DODOX'`, `last_number` INTEGER NOT NULL DEFAULT 0, `updated_at` TEXT NOT NULL). Generates `DODOX-2026-000001`.
28. **`orders`** — Master order-request record (`id`, `reference` UNIQUE, `tracking_token_hash`, `idempotency_key` UNIQUE, `customer_id` FK -> `customers.id`, `status` (`received` | `under_review` | `confirmed` | `in_production` | `ready` | `out_for_delivery` | `delivered` | `cancelled` | `rejected`), `payment_status` (`unpaid_request` | `pending_payment` | `paid` | `refunded` | `not_applicable`), `payment_provider`, `payment_reference`, `currency` (`'RWF'`), `item_count` INTEGER, `subtotal_amount` INTEGER, `discount_amount` INTEGER, `coupon_id` FK -> `coupons.id`, `coupon_code`, `care_protection_enabled` INTEGER, `care_protection_amount` INTEGER, `delivery_method` (`kigali-white-glove` | `regional-courier`), `delivery_amount` INTEGER, `vat_rate_bps` INTEGER, `prices_include_vat` INTEGER, `vat_amount` INTEGER, `total_amount` INTEGER, `stock_reserved` INTEGER, `customer_first_name`, `customer_last_name`, `customer_email`, `customer_phone`, `customer_notes`, `confirmed_at`, `in_production_at`, `ready_at`, `delivered_at`, `cancelled_at`, `created_at`, `updated_at`). Indexed on `reference`, `customer_id`, `customer_email`, `status`, `created_at`.
29. **`order_items`** — Snapshot of verified order lines (`id`, `order_id` FK -> `orders.id` CASCADE, `product_id` FK -> `products.id` SET NULL, `variant_id` FK -> `product_variants.id` SET NULL, `product_slug`, `product_name`, `product_sku`, `product_image`, `availability_at_order`, `lead_time_at_order`, `base_unit_price` INTEGER, `variant_price_delta` INTEGER, `unit_price` INTEGER, `quantity` INTEGER, `line_total` INTEGER, `selected_options_json`, `variant_summary`, `created_at`).
30. **`order_status_history`** — Immutable audit trail of every status transition (`id`, `order_id` FK CASCADE, `from_status`, `to_status`, `note`, `is_customer_visible` INTEGER, `changed_by_user_id` FK -> `users.id`, `created_at`).
31. **`order_notes`** — Internal concierge/production notes (`id`, `order_id` FK CASCADE, `author_user_id` FK -> `users.id`, `note`, `is_internal` INTEGER DEFAULT 1, `created_at`).
32. **`order_addresses`** — Delivery & billing snapshots (`id`, `order_id` FK CASCADE, `address_type` (`delivery` | `billing`), `recipient_name`, `email`, `phone`, `city`, `district`, `address_line`, `landmark`, `country` DEFAULT `'Rwanda'`).

---

### Domain E — Customers (3 Tables)

33. **`customers`** — Customer directory (`id`, `email` UNIQUE, `first_name`, `last_name`, `phone`, `city`, `district`, `order_count` INTEGER, `confirmed_order_count` INTEGER, `total_requested_amount` INTEGER, `confirmed_spend_amount` INTEGER, `last_order_at`, `accepts_marketing` INTEGER, `is_active` INTEGER, `created_at`, `updated_at`).
34. **`customer_addresses`** — Saved delivery addresses (`id`, `customer_id` FK CASCADE, `label`, `recipient_name`, `phone`, `city`, `district`, `address_line`, `landmark`, `is_default` INTEGER, `created_at`, `updated_at`).
35. **`customer_notes`** — Internal CRM notes (`id`, `customer_id` FK CASCADE, `author_user_id` FK -> `users.id`, `note`, `created_at`).

---

### Domain E2 — Promotions & Discounts (3 Tables)

36. **`coupons`** — Server-validated promo codes (`id`, `code` UNIQUE, `label`, `description`, `discount_type` (`fixed` | `percent`), `value` INTEGER, `minimum_subtotal` INTEGER, `maximum_discount` INTEGER, `starts_at`, `expires_at`, `usage_limit` INTEGER, `usage_count` INTEGER, `per_customer_limit` INTEGER, `is_active` INTEGER, `is_demo` INTEGER, `created_by_user_id` FK, `created_at`, `updated_at`).
37. **`coupon_redemptions`** — Per-order redemption log (`id`, `coupon_id` FK CASCADE, `order_id` FK CASCADE, `customer_id` FK, `customer_email`, `discount_amount` INTEGER, `redeemed_at`).
38. **`promotions`** — Storewide/category promotional campaigns (`id`, `name`, `slug` UNIQUE, `description`, `campaign_type`, `discount_type`, `value` INTEGER, `minimum_subtotal` INTEGER, `starts_at`, `expires_at`, `banner_text`, `is_active` INTEGER, `created_at`, `updated_at`).

---

### Domain F — Website Content & Settings (8 Tables)

39. **`pages`** — Editorial & static pages (`id`, `slug` UNIQUE, `title`, `eyebrow`, `excerpt`, `content_json`, `hero_image_url`, `seo_title`, `seo_description`, `status` (`draft` | `published`), `published_at`, `updated_by_user_id` FK, `created_at`, `updated_at`).
40. **`journal_posts`** — Atelier Journal articles (`id`, `slug` UNIQUE, `title`, `excerpt`, `category`, `read_time`, `published_date`, `image_url`, `image_alt`, `featured` INTEGER, `body_json`, `seo_title`, `seo_description`, `is_sample` INTEGER, `status` (`draft` | `published`), `author_user_id` FK, `created_at`, `updated_at`).
41. **`testimonials`** — Collector quotes (`id`, `quote`, `author`, `initials`, `location`, `piece_name`, `rating` INTEGER, `is_sample` INTEGER, `is_published` INTEGER, `sort_order` INTEGER, `created_at`, `updated_at`).
42. **`navigation_items`** — Header & footer menus (`id`, `menu_location` (`header` | `footer_collections` | `footer_services` | `footer_house`), `parent_id` self-FK, `label`, `href`, `description`, `sort_order` INTEGER, `is_published` INTEGER, `created_at`, `updated_at`).
43. **`homepage_sections`** — Configurable homepage blocks (`id`, `section_key` UNIQUE, `eyebrow`, `title`, `subtitle`, `description`, `primary_cta_label`, `primary_cta_href`, `secondary_cta_label`, `secondary_cta_href`, `image_url`, `image_alt`, `metadata_json`, `sort_order` INTEGER, `is_published` INTEGER, `updated_at`).
44. **`banners`** — Announcement bar & promotional banners (`id`, `slug` UNIQUE, `placement` (`announcement` | `homepage_atelier` | `catalog_banner`), `title`, `subtitle`, `cta_label`, `cta_href`, `image_url`, `theme_variant`, `starts_at`, `expires_at`, `sort_order` INTEGER, `is_active` INTEGER, `created_at`, `updated_at`).
45. **`site_settings`** — Storefront business settings (`key` PRIMARY KEY, `value_json`, `group_name`, `label`, `is_public` INTEGER, `updated_by_user_id` FK, `updated_at`).
46. **`faqs`** — Frequently asked questions (`id`, `category` (`atelier` | `shipping` | `care` | `general`), `question`, `answer`, `sort_order` INTEGER, `is_published` INTEGER, `created_at`, `updated_at`).

---

### Domain G — Customer Enquiries & Marketing (3 Tables)

47. **`contact_messages`** — Contact form submissions (`id`, `reference` UNIQUE, `name`, `email`, `phone`, `subject`, `message`, `is_read` INTEGER, `status` (`new` | `open` | `replied` | `archived`), `internal_notes`, `assigned_to_user_id` FK, `ip_hash`, `created_at`, `updated_at`).
48. **`atelier_enquiries`** — Custom Atelier bespoke briefs (`id`, `reference` UNIQUE, `customer_id` FK, `name`, `email`, `phone`, `furniture_type`, `dimensions`, `materials`, `finish`, `budget`, `description`, `contact_preference` (`email` | `phone` | `whatsapp`), `reference_images_json`, `quoted_amount` INTEGER, `status` (`new` | 'reviewing' | `quotation_prepared` | `awaiting_customer` | `accepted` | `in_production` | `completed` | `rejected`), `is_archived` INTEGER, `internal_notes`, `assigned_to_user_id` FK, `ip_hash`, `created_at`, `updated_at`).
49. **`newsletter_subscribers`** — Email list with explicit consent audit (`id`, `email` UNIQUE, `status` (`active` | `unsubscribed`), `consent_given` INTEGER, `consent_text`, `consent_source`, `consented_at`, `unsubscribe_token` UNIQUE, `unsubscribed_at`, `ip_hash`, `created_at`, `updated_at`).

---

### Domain H — Media, Administration & Security (5 Tables)

50. **`media_assets`** — R2 object metadata (`id`, `object_key` UNIQUE, `public_url`, `filename`, `mime_type`, `size_bytes` INTEGER, `width` INTEGER, `height` INTEGER, `alt_text`, `folder`, `storage_driver` (`r2` | `local_public`), `uploaded_by_user_id` FK, `created_at`).
51. **`activity_logs`** — Immutable audit trail (`id`, `actor_user_id` FK, `actor_email`, `action`, `resource_type`, `resource_id`, `summary`, `before_json`, `after_json`, `ip_hash`, `user_agent`, `created_at`). Indexed on `(resource_type, resource_id)`, `actor_user_id`, `created_at`.
52. **`notifications`** — Admin notification centre (`id`, `recipient_user_id` FK nullable, `category`, `title`, `body`, `href`, `is_read` INTEGER, `read_at`, `created_at`).
53. **`system_settings`** — Internal platform settings (`key` PRIMARY KEY, `value_json`, `description`, `updated_by_user_id` FK, `updated_at`).
54. **`rate_limits`** — Stateless Worker rate-limiting counters (`bucket_key` PRIMARY KEY, `hit_count` INTEGER, `window_started_at` INTEGER, `expires_at` INTEGER).
