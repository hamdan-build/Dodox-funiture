CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`actor_email` text,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`summary` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`ip_hash` text,
	`user_agent` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `activity_logs_created_idx` ON `activity_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `activity_logs_actor_idx` ON `activity_logs` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `activity_logs_resource_idx` ON `activity_logs` (`resource_type`,`resource_id`);--> statement-breakpoint
CREATE TABLE `atelier_enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`customer_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`furniture_type` text NOT NULL,
	`dimensions` text NOT NULL,
	`materials` text NOT NULL,
	`finish` text NOT NULL,
	`budget` text NOT NULL,
	`description` text NOT NULL,
	`contact_preference` text DEFAULT 'email' NOT NULL,
	`reference_images_json` text DEFAULT '[]' NOT NULL,
	`quoted_amount` integer,
	`status` text DEFAULT 'new' NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`internal_notes` text,
	`assigned_to_user_id` text,
	`ip_hash` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `atelier_enquiries_ref_unique` ON `atelier_enquiries` (`reference`);--> statement-breakpoint
CREATE INDEX `atelier_enquiries_status_idx` ON `atelier_enquiries` (`is_archived`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `banners` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`placement` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`cta_label` text,
	`cta_href` text,
	`image_url` text,
	`theme_variant` text DEFAULT 'ink' NOT NULL,
	`starts_at` text,
	`expires_at` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `banners_slug_unique` ON `banners` (`slug`);--> statement-breakpoint
CREATE INDEX `banners_placement_idx` ON `banners` (`placement`,`is_active`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`tagline` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`image_url` text DEFAULT '/images/rooms/living-room.jpg' NOT NULL,
	`image_alt` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `categories_published_sort_idx` ON `categories` (`is_published`,`sort_order`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`tagline` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`hero_image_url` text,
	`hero_image_alt` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
CREATE INDEX `collections_published_sort_idx` ON `collections` (`is_published`,`sort_order`);--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`internal_notes` text,
	`assigned_to_user_id` text,
	`ip_hash` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contact_messages_ref_unique` ON `contact_messages` (`reference`);--> statement-breakpoint
CREATE INDEX `contact_messages_status_idx` ON `contact_messages` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `coupon_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`coupon_id` text NOT NULL,
	`order_id` text NOT NULL,
	`customer_id` text,
	`customer_email` text NOT NULL,
	`discount_amount` integer NOT NULL,
	`redeemed_at` text NOT NULL,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `coupon_redemptions_coupon_idx` ON `coupon_redemptions` (`coupon_id`);--> statement-breakpoint
CREATE INDEX `coupon_redemptions_email_idx` ON `coupon_redemptions` (`coupon_id`,`customer_email`);--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`discount_type` text NOT NULL,
	`value` integer NOT NULL,
	`minimum_subtotal` integer DEFAULT 0 NOT NULL,
	`maximum_discount` integer,
	`starts_at` text,
	`expires_at` text,
	`usage_limit` integer,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`per_customer_limit` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_by_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE INDEX `coupons_active_idx` ON `coupons` (`is_active`);--> statement-breakpoint
CREATE TABLE `customer_addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`label` text DEFAULT 'Primary Delivery' NOT NULL,
	`recipient_name` text NOT NULL,
	`phone` text NOT NULL,
	`city` text NOT NULL,
	`district` text NOT NULL,
	`address_line` text NOT NULL,
	`landmark` text,
	`is_default` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `customer_addresses_customer_idx` ON `customer_addresses` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customer_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`author_user_id` text,
	`note` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `customer_notes_customer_idx` ON `customer_notes` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone` text NOT NULL,
	`city` text,
	`district` text,
	`order_count` integer DEFAULT 0 NOT NULL,
	`confirmed_order_count` integer DEFAULT 0 NOT NULL,
	`total_requested_amount` integer DEFAULT 0 NOT NULL,
	`confirmed_spend_amount` integer DEFAULT 0 NOT NULL,
	`last_order_at` text,
	`accepts_marketing` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `customers_phone_idx` ON `customers` (`phone`);--> statement-breakpoint
CREATE INDEX `customers_created_idx` ON `customers` (`created_at`);--> statement-breakpoint
CREATE TABLE `faqs` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text DEFAULT 'general' NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `faqs_category_sort_idx` ON `faqs` (`category`,`is_published`,`sort_order`);--> statement-breakpoint
CREATE TABLE `homepage_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`section_key` text NOT NULL,
	`eyebrow` text,
	`title` text NOT NULL,
	`subtitle` text,
	`description` text,
	`primary_cta_label` text,
	`primary_cta_href` text,
	`secondary_cta_label` text,
	`secondary_cta_href` text,
	`image_url` text,
	`image_alt` text,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `homepage_sections_key_unique` ON `homepage_sections` (`section_key`);--> statement-breakpoint
CREATE INDEX `homepage_sections_sort_idx` ON `homepage_sections` (`is_published`,`sort_order`);--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text,
	`sku` text NOT NULL,
	`quantity_on_hand` integer DEFAULT 0 NOT NULL,
	`quantity_reserved` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 2 NOT NULL,
	`allow_backorder` integer DEFAULT true NOT NULL,
	`warehouse_location` text DEFAULT 'Kigali Atelier & Showroom' NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_sku_unique` ON `inventory` (`sku`);--> statement-breakpoint
CREATE INDEX `inventory_product_idx` ON `inventory` (`product_id`);--> statement-breakpoint
CREATE INDEX `inventory_variant_idx` ON `inventory` (`variant_id`);--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`inventory_id` text NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text,
	`movement_type` text NOT NULL,
	`quantity_delta` integer NOT NULL,
	`previous_on_hand` integer NOT NULL,
	`new_on_hand` integer NOT NULL,
	`previous_reserved` integer DEFAULT 0 NOT NULL,
	`new_reserved` integer DEFAULT 0 NOT NULL,
	`reference_type` text,
	`reference_id` text,
	`reason` text NOT NULL,
	`actor_user_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `inventory_movements_inv_idx` ON `inventory_movements` (`inventory_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `inventory_movements_product_idx` ON `inventory_movements` (`product_id`);--> statement-breakpoint
CREATE TABLE `journal_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text NOT NULL,
	`category` text NOT NULL,
	`read_time` text DEFAULT '5 min read' NOT NULL,
	`published_date` text NOT NULL,
	`image_url` text NOT NULL,
	`image_alt` text DEFAULT '' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`body_json` text DEFAULT '[]' NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`is_sample` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`author_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `journal_posts_slug_unique` ON `journal_posts` (`slug`);--> statement-breakpoint
CREATE INDEX `journal_posts_status_date_idx` ON `journal_posts` (`status`,`published_date`);--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`ip_hash` text NOT NULL,
	`succeeded` integer NOT NULL,
	`reason` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `login_attempts_email_created_idx` ON `login_attempts` (`email`,`created_at`);--> statement-breakpoint
CREATE INDEX `login_attempts_ip_created_idx` ON `login_attempts` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`public_url` text NOT NULL,
	`filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`width` integer,
	`height` integer,
	`alt_text` text DEFAULT '' NOT NULL,
	`folder` text DEFAULT 'general' NOT NULL,
	`storage_driver` text DEFAULT 'r2' NOT NULL,
	`uploaded_by_user_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_assets_object_key_unique` ON `media_assets` (`object_key`);--> statement-breakpoint
CREATE INDEX `media_assets_folder_idx` ON `media_assets` (`folder`);--> statement-breakpoint
CREATE INDEX `media_assets_created_idx` ON `media_assets` (`created_at`);--> statement-breakpoint
CREATE TABLE `navigation_items` (
	`id` text PRIMARY KEY NOT NULL,
	`menu_location` text NOT NULL,
	`parent_id` text,
	`label` text NOT NULL,
	`href` text NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `navigation_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `navigation_items_loc_sort_idx` ON `navigation_items` (`menu_location`,`sort_order`);--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`consent_given` integer DEFAULT true NOT NULL,
	`consent_text` text NOT NULL,
	`consent_source` text DEFAULT 'storefront' NOT NULL,
	`consented_at` text NOT NULL,
	`unsubscribe_token` text NOT NULL,
	`unsubscribed_at` text,
	`ip_hash` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscribers_email_unique` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscribers_token_unique` ON `newsletter_subscribers` (`unsubscribe_token`);--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_status_idx` ON `newsletter_subscribers` (`status`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_user_id` text,
	`category` text DEFAULT 'system' NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`href` text,
	`is_read` integer DEFAULT false NOT NULL,
	`read_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`recipient_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_read_created_idx` ON `notifications` (`is_read`,`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_idx` ON `notifications` (`recipient_user_id`);--> statement-breakpoint
CREATE TABLE `order_addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`address_type` text DEFAULT 'delivery' NOT NULL,
	`recipient_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`city` text NOT NULL,
	`district` text NOT NULL,
	`address_line` text NOT NULL,
	`landmark` text,
	`country` text DEFAULT 'Rwanda' NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_addresses_order_idx` ON `order_addresses` (`order_id`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text,
	`variant_id` text,
	`product_slug` text NOT NULL,
	`product_name` text NOT NULL,
	`product_sku` text,
	`product_image` text NOT NULL,
	`availability_at_order` text NOT NULL,
	`lead_time_at_order` text NOT NULL,
	`base_unit_price` integer NOT NULL,
	`variant_price_delta` integer DEFAULT 0 NOT NULL,
	`unit_price` integer NOT NULL,
	`quantity` integer NOT NULL,
	`line_total` integer NOT NULL,
	`selected_options_json` text DEFAULT '[]' NOT NULL,
	`variant_summary` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_product_idx` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `order_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`author_user_id` text,
	`note` text NOT NULL,
	`is_internal` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `order_notes_order_idx` ON `order_notes` (`order_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `order_reference_sequences` (
	`year` integer PRIMARY KEY NOT NULL,
	`prefix` text DEFAULT 'DODOX' NOT NULL,
	`last_number` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`note` text,
	`is_customer_visible` integer DEFAULT true NOT NULL,
	`changed_by_user_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `order_status_history_order_idx` ON `order_status_history` (`order_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`tracking_token_hash` text NOT NULL,
	`idempotency_key` text,
	`customer_id` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`payment_status` text DEFAULT 'unpaid_request' NOT NULL,
	`payment_provider` text,
	`payment_reference` text,
	`currency` text DEFAULT 'RWF' NOT NULL,
	`item_count` integer NOT NULL,
	`subtotal_amount` integer NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`coupon_id` text,
	`coupon_code` text,
	`care_protection_enabled` integer DEFAULT false NOT NULL,
	`care_protection_amount` integer DEFAULT 0 NOT NULL,
	`delivery_method` text NOT NULL,
	`delivery_amount` integer DEFAULT 0 NOT NULL,
	`vat_rate_bps` integer DEFAULT 1800 NOT NULL,
	`prices_include_vat` integer DEFAULT true NOT NULL,
	`vat_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer NOT NULL,
	`stock_reserved` integer DEFAULT false NOT NULL,
	`customer_first_name` text NOT NULL,
	`customer_last_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_notes` text,
	`confirmed_at` text,
	`in_production_at` text,
	`ready_at` text,
	`delivered_at` text,
	`cancelled_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_reference_unique` ON `orders` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_idempotency_unique` ON `orders` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `orders_customer_idx` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `orders_email_idx` ON `orders` (`customer_email`);--> statement-breakpoint
CREATE INDEX `orders_status_created_idx` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_created_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE TABLE `pages` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`eyebrow` text,
	`excerpt` text,
	`content_json` text DEFAULT '[]' NOT NULL,
	`hero_image_url` text,
	`seo_title` text,
	`seo_description` text,
	`status` text DEFAULT 'published' NOT NULL,
	`published_at` text,
	`updated_by_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_slug_unique` ON `pages` (`slug`);--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_hash_unique` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `password_reset_tokens_user_idx` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`module` text NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_key_unique` ON `permissions` (`key`);--> statement-breakpoint
CREATE INDEX `permissions_module_idx` ON `permissions` (`module`);--> statement-breakpoint
CREATE TABLE `product_categories` (
	`product_id` text NOT NULL,
	`category_id` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`product_id`, `category_id`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_categories_cat_idx` ON `product_categories` (`category_id`);--> statement-breakpoint
CREATE TABLE `product_colors` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`hex` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_colors_product_idx` ON `product_colors` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`media_id` text,
	`url` text NOT NULL,
	`alt_text` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `product_images_product_sort_idx` ON `product_images` (`product_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `product_materials` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_materials_product_idx` ON `product_materials` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_materials_name_idx` ON `product_materials` (`name`);--> statement-breakpoint
CREATE TABLE `product_option_values` (
	`id` text PRIMARY KEY NOT NULL,
	`option_id` text NOT NULL,
	`product_id` text NOT NULL,
	`value_key` text NOT NULL,
	`label` text NOT NULL,
	`helper_text` text,
	`price_delta` integer DEFAULT 0 NOT NULL,
	`swatch_hex` text,
	`lead_time_override` text,
	`is_available` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`option_id`) REFERENCES `product_options`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_option_values_opt_key_unique` ON `product_option_values` (`option_id`,`value_key`);--> statement-breakpoint
CREATE INDEX `product_option_values_product_idx` ON `product_option_values` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_options` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`option_key` text NOT NULL,
	`label` text NOT NULL,
	`helper_text` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_options_product_key_unique` ON `product_options` (`product_id`,`option_key`);--> statement-breakpoint
CREATE INDEX `product_options_product_sort_idx` ON `product_options` (`product_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `product_specifications` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`group_type` text DEFAULT 'spec' NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_specs_product_group_idx` ON `product_specifications` (`product_id`,`group_type`,`sort_order`);--> statement-breakpoint
CREATE TABLE `product_tag_relations` (
	`product_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`product_id`, `tag_id`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `product_tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_tag_relations_tag_idx` ON `product_tag_relations` (`tag_id`);--> statement-breakpoint
CREATE TABLE `product_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_tags_slug_unique` ON `product_tags` (`slug`);--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`sku` text NOT NULL,
	`title` text NOT NULL,
	`option_values_json` text DEFAULT '{}' NOT NULL,
	`price_override` integer,
	`price_delta` integer DEFAULT 0 NOT NULL,
	`availability_override` text,
	`lead_time_override` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variants_sku_unique` ON `product_variants` (`sku`);--> statement-breakpoint
CREATE INDEX `product_variants_product_idx` ON `product_variants` (`product_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`story` text DEFAULT '' NOT NULL,
	`category_id` text NOT NULL,
	`collection_id` text,
	`base_price` integer NOT NULL,
	`compare_at_price` integer,
	`availability` text DEFAULT 'made-to-order' NOT NULL,
	`lead_time` text DEFAULT '10–14 days' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`badge` text,
	`rating_tenths` integer,
	`review_count` integer DEFAULT 0 NOT NULL,
	`seating` integer,
	`seo_title` text,
	`seo_description` text,
	`status` text DEFAULT 'published' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `products_status_sort_idx` ON `products` (`status`,`sort_order`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `products_collection_idx` ON `products` (`collection_id`);--> statement-breakpoint
CREATE INDEX `products_featured_idx` ON `products` (`featured`);--> statement-breakpoint
CREATE INDEX `products_availability_idx` ON `products` (`availability`);--> statement-breakpoint
CREATE INDEX `products_price_idx` ON `products` (`base_price`);--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`campaign_type` text DEFAULT 'seasonal' NOT NULL,
	`discount_type` text DEFAULT 'percent' NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`minimum_subtotal` integer DEFAULT 0 NOT NULL,
	`starts_at` text,
	`expires_at` text,
	`banner_text` text,
	`is_active` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `promotions_slug_unique` ON `promotions` (`slug`);--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`po_number` text NOT NULL,
	`supplier_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`currency` text DEFAULT 'RWF' NOT NULL,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`expected_at` text,
	`received_at` text,
	`items_json` text DEFAULT '[]' NOT NULL,
	`notes` text,
	`created_by_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_orders_number_unique` ON `purchase_orders` (`po_number`);--> statement-breakpoint
CREATE INDEX `purchase_orders_supplier_idx` ON `purchase_orders` (`supplier_id`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`bucket_key` text PRIMARY KEY NOT NULL,
	`hit_count` integer DEFAULT 0 NOT NULL,
	`window_started_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limits_expires_idx` ON `rate_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	PRIMARY KEY(`role_id`, `permission_id`),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `role_permissions_perm_idx` ON `role_permissions` (`permission_id`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`is_system` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_slug_unique` ON `roles` (`slug`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`ip_hash` text,
	`user_agent` text,
	`expires_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`revoked_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`group_name` text DEFAULT 'general' NOT NULL,
	`label` text NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`updated_by_user_id` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `stock_adjustments` (
	`id` text PRIMARY KEY NOT NULL,
	`adjustment_reference` text NOT NULL,
	`inventory_id` text NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text,
	`adjustment_type` text NOT NULL,
	`quantity_before` integer NOT NULL,
	`quantity_change` integer NOT NULL,
	`quantity_after` integer NOT NULL,
	`reason` text NOT NULL,
	`notes` text,
	`created_by_user_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stock_adjustments_ref_unique` ON `stock_adjustments` (`adjustment_reference`);--> statement-breakpoint
CREATE INDEX `stock_adjustments_inv_idx` ON `stock_adjustments` (`inventory_id`);--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`contact_name` text,
	`email` text,
	`phone` text,
	`city` text,
	`country` text DEFAULT 'Rwanda' NOT NULL,
	`materials_supplied` text,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_code_unique` ON `suppliers` (`code`);--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`updated_by_user_id` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`updated_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`quote` text NOT NULL,
	`author` text NOT NULL,
	`initials` text NOT NULL,
	`location` text NOT NULL,
	`piece_name` text NOT NULL,
	`rating` integer DEFAULT 5 NOT NULL,
	`is_sample` integer DEFAULT true NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `testimonials_published_sort_idx` ON `testimonials` (`is_published`,`sort_order`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	`assigned_by_user_id` text,
	`assigned_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `role_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `user_roles_role_idx` ON `user_roles` (`role_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone` text,
	`avatar_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`must_change_password` integer DEFAULT false NOT NULL,
	`last_login_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_is_active_idx` ON `users` (`is_active`);