import {
  type AnySQLiteColumn,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ============================================================================
// DOMAIN 1 — AUTHENTICATION, RBAC & STAFF (8 Tables)
// ============================================================================

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    mustChangePassword: integer("must_change_password", { mode: "boolean" })
      .notNull()
      .default(false),
    lastLoginAt: text("last_login_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_is_active_idx").on(table.isActive),
  ],
);

export const roles = sqliteTable(
  "roles",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    isSystem: integer("is_system", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("roles_slug_unique").on(table.slug)],
);

export const permissions = sqliteTable(
  "permissions",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    module: text("module").notNull(),
    description: text("description").notNull(),
  },
  (table) => [
    uniqueIndex("permissions_key_unique").on(table.key),
    index("permissions_module_idx").on(table.module),
  ],
);

export const userRoles = sqliteTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedByUserId: text("assigned_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    assignedAt: text("assigned_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index("user_roles_role_idx").on(table.roleId),
  ],
);

export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index("role_permissions_perm_idx").on(table.permissionId),
  ],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    expiresAt: text("expires_at").notNull(),
    lastSeenAt: text("last_seen_at").notNull(),
    revokedAt: text("revoked_at"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const passwordResetTokens = sqliteTable(
  "password_reset_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    usedAt: text("used_at"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_hash_unique").on(table.tokenHash),
    index("password_reset_tokens_user_idx").on(table.userId),
  ],
);

export const loginAttempts = sqliteTable(
  "login_attempts",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    ipHash: text("ip_hash").notNull(),
    succeeded: integer("succeeded", { mode: "boolean" }).notNull(),
    reason: text("reason"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("login_attempts_email_created_idx").on(table.email, table.createdAt),
    index("login_attempts_ip_created_idx").on(table.ipHash, table.createdAt),
  ],
);

// ============================================================================
// DOMAIN 2 — MEDIA LIBRARY (R2 Metadata — referenced by Catalogue)
// ============================================================================

export const mediaAssets = sqliteTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    objectKey: text("object_key").notNull(),
    publicUrl: text("public_url").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    altText: text("alt_text").notNull().default(""),
    folder: text("folder").notNull().default("general"),
    storageDriver: text("storage_driver").notNull().default("r2"),
    uploadedByUserId: text("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("media_assets_object_key_unique").on(table.objectKey),
    index("media_assets_folder_idx").on(table.folder),
    index("media_assets_created_idx").on(table.createdAt),
  ],
);

// ============================================================================
// DOMAIN 3 — PRODUCTS, CATEGORIES & COLLECTIONS (13 Tables)
// ============================================================================

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    parentId: text("parent_id").references((): AnySQLiteColumn => categories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    tagline: text("tagline").notNull().default(""),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url").notNull().default("/images/rooms/living-room.jpg"),
    imageAlt: text("image_alt").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(true),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("categories_slug_unique").on(table.slug),
    index("categories_published_sort_idx").on(table.isPublished, table.sortOrder),
  ],
);

export const collections = sqliteTable(
  "collections",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull().default(""),
    description: text("description").notNull().default(""),
    heroImageUrl: text("hero_image_url"),
    heroImageAlt: text("hero_image_alt"),
    sortOrder: integer("sort_order").notNull().default(0),
    isFeatured: integer("is_featured", { mode: "boolean" })
      .notNull()
      .default(false),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("collections_slug_unique").on(table.slug),
    index("collections_published_sort_idx").on(table.isPublished, table.sortOrder),
  ],
);

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    description: text("description").notNull().default(""),
    story: text("story").notNull().default(""),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    collectionId: text("collection_id").references(() => collections.id, {
      onDelete: "set null",
    }),
    /** Integer Rwandan Francs (RWF). Never floating-point. */
    basePrice: integer("base_price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    availability: text("availability").notNull().default("made-to-order"),
    leadTime: text("lead_time").notNull().default("10–14 days"),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    badge: text("badge"),
    /** Stored in tenths (e.g. 49 = 4.9) to avoid floating-point arithmetic. */
    ratingTenths: integer("rating_tenths"),
    reviewCount: integer("review_count").notNull().default(0),
    seating: integer("seating"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    /** draft | published | archived */
    status: text("status").notNull().default("published"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("products_slug_unique").on(table.slug),
    uniqueIndex("products_sku_unique").on(table.sku),
    index("products_status_sort_idx").on(table.status, table.sortOrder),
    index("products_category_idx").on(table.categoryId),
    index("products_collection_idx").on(table.collectionId),
    index("products_featured_idx").on(table.featured),
    index("products_availability_idx").on(table.availability),
    index("products_price_idx").on(table.basePrice),
  ],
);

export const productCategories = sqliteTable(
  "product_categories",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    isPrimary: integer("is_primary", { mode: "boolean" })
      .notNull()
      .default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index("product_categories_cat_idx").on(table.categoryId),
  ],
);

export const productImages = sqliteTable(
  "product_images",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaId: text("media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    url: text("url").notNull(),
    altText: text("alt_text").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: integer("is_primary", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("product_images_product_sort_idx").on(table.productId, table.sortOrder),
  ],
);

export const productOptions = sqliteTable(
  "product_options",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    optionKey: text("option_key").notNull(),
    label: text("label").notNull(),
    helperText: text("helper_text"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    uniqueIndex("product_options_product_key_unique").on(
      table.productId,
      table.optionKey,
    ),
    index("product_options_product_sort_idx").on(table.productId, table.sortOrder),
  ],
);

export const productOptionValues = sqliteTable(
  "product_option_values",
  {
    id: text("id").primaryKey(),
    optionId: text("option_id")
      .notNull()
      .references(() => productOptions.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    valueKey: text("value_key").notNull(),
    label: text("label").notNull(),
    helperText: text("helper_text"),
    /** Integer RWF price delta relative to product basePrice */
    priceDelta: integer("price_delta").notNull().default(0),
    swatchHex: text("swatch_hex"),
    leadTimeOverride: text("lead_time_override"),
    isAvailable: integer("is_available", { mode: "boolean" })
      .notNull()
      .default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    uniqueIndex("product_option_values_opt_key_unique").on(
      table.optionId,
      table.valueKey,
    ),
    index("product_option_values_product_idx").on(table.productId),
  ],
);

export const productVariants = sqliteTable(
  "product_variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    title: text("title").notNull(),
    optionValuesJson: text("option_values_json").notNull().default("{}"),
    priceOverride: integer("price_override"),
    priceDelta: integer("price_delta").notNull().default(0),
    availabilityOverride: text("availability_override"),
    leadTimeOverride: text("lead_time_override"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("product_variants_sku_unique").on(table.sku),
    index("product_variants_product_idx").on(table.productId),
  ],
);

export const productTags = sqliteTable(
  "product_tags",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
  },
  (table) => [uniqueIndex("product_tags_slug_unique").on(table.slug)],
);

export const productTagRelations = sqliteTable(
  "product_tag_relations",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => productTags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.tagId] }),
    index("product_tag_relations_tag_idx").on(table.tagId),
  ],
);

export const productSpecifications = sqliteTable(
  "product_specifications",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** spec | dimension | care */
    groupType: text("group_type").notNull().default("spec"),
    label: text("label").notNull(),
    value: text("value").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("product_specs_product_group_idx").on(
      table.productId,
      table.groupType,
      table.sortOrder,
    ),
  ],
);

export const productMaterials = sqliteTable(
  "product_materials",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("product_materials_product_idx").on(table.productId),
    index("product_materials_name_idx").on(table.name),
  ],
);

export const productColors = sqliteTable(
  "product_colors",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    hex: text("hex").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("product_colors_product_idx").on(table.productId)],
);

// ============================================================================
// DOMAIN 4 — INVENTORY & PROCUREMENT (5 Tables)
// ============================================================================

export const inventory = sqliteTable(
  "inventory",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: text("variant_id").references(() => productVariants.id, {
      onDelete: "cascade",
    }),
    sku: text("sku").notNull(),
    quantityOnHand: integer("quantity_on_hand").notNull().default(0),
    quantityReserved: integer("quantity_reserved").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(2),
    allowBackorder: integer("allow_backorder", { mode: "boolean" })
      .notNull()
      .default(true),
    warehouseLocation: text("warehouse_location")
      .notNull()
      .default("Kigali Atelier & Showroom"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("inventory_sku_unique").on(table.sku),
    index("inventory_product_idx").on(table.productId),
    index("inventory_variant_idx").on(table.variantId),
  ],
);

export const inventoryMovements = sqliteTable(
  "inventory_movements",
  {
    id: text("id").primaryKey(),
    inventoryId: text("inventory_id")
      .notNull()
      .references(() => inventory.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: text("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    movementType: text("movement_type").notNull(),
    quantityDelta: integer("quantity_delta").notNull(),
    previousOnHand: integer("previous_on_hand").notNull(),
    newOnHand: integer("new_on_hand").notNull(),
    previousReserved: integer("previous_reserved").notNull().default(0),
    newReserved: integer("new_reserved").notNull().default(0),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    reason: text("reason").notNull(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("inventory_movements_inv_idx").on(table.inventoryId, table.createdAt),
    index("inventory_movements_product_idx").on(table.productId),
  ],
);

export const stockAdjustments = sqliteTable(
  "stock_adjustments",
  {
    id: text("id").primaryKey(),
    adjustmentReference: text("adjustment_reference").notNull(),
    inventoryId: text("inventory_id")
      .notNull()
      .references(() => inventory.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: text("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    adjustmentType: text("adjustment_type").notNull(),
    quantityBefore: integer("quantity_before").notNull(),
    quantityChange: integer("quantity_change").notNull(),
    quantityAfter: integer("quantity_after").notNull(),
    reason: text("reason").notNull(),
    notes: text("notes"),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("stock_adjustments_ref_unique").on(table.adjustmentReference),
    index("stock_adjustments_inv_idx").on(table.inventoryId),
  ],
);

export const suppliers = sqliteTable(
  "suppliers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    city: text("city"),
    country: text("country").notNull().default("Rwanda"),
    materialsSupplied: text("materials_supplied"),
    notes: text("notes"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("suppliers_code_unique").on(table.code)],
);

export const purchaseOrders = sqliteTable(
  "purchase_orders",
  {
    id: text("id").primaryKey(),
    poNumber: text("po_number").notNull(),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("draft"),
    currency: text("currency").notNull().default("RWF"),
    totalAmount: integer("total_amount").notNull().default(0),
    expectedAt: text("expected_at"),
    receivedAt: text("received_at"),
    itemsJson: text("items_json").notNull().default("[]"),
    notes: text("notes"),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("purchase_orders_number_unique").on(table.poNumber),
    index("purchase_orders_supplier_idx").on(table.supplierId),
  ],
);

// ============================================================================
// DOMAIN 5 — CUSTOMERS (3 Tables)
// ============================================================================

export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone").notNull(),
    city: text("city"),
    district: text("district"),
    orderCount: integer("order_count").notNull().default(0),
    confirmedOrderCount: integer("confirmed_order_count").notNull().default(0),
    totalRequestedAmount: integer("total_requested_amount").notNull().default(0),
    confirmedSpendAmount: integer("confirmed_spend_amount").notNull().default(0),
    lastOrderAt: text("last_order_at"),
    acceptsMarketing: integer("accepts_marketing", { mode: "boolean" })
      .notNull()
      .default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("customers_email_unique").on(table.email),
    index("customers_phone_idx").on(table.phone),
    index("customers_created_idx").on(table.createdAt),
  ],
);

export const customerAddresses = sqliteTable(
  "customer_addresses",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    label: text("label").notNull().default("Primary Delivery"),
    recipientName: text("recipient_name").notNull(),
    phone: text("phone").notNull(),
    city: text("city").notNull(),
    district: text("district").notNull(),
    addressLine: text("address_line").notNull(),
    landmark: text("landmark"),
    isDefault: integer("is_default", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("customer_addresses_customer_idx").on(table.customerId)],
);

export const customerNotes = sqliteTable(
  "customer_notes",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text("note").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("customer_notes_customer_idx").on(table.customerId)],
);

// ============================================================================
// DOMAIN 6 — PROMOTIONS & COUPONS (3 Tables — referenced by Orders)
// ============================================================================

export const coupons = sqliteTable(
  "coupons",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    /** fixed | percent */
    discountType: text("discount_type").notNull(),
    /** Integer RWF for fixed; integer percentage (1-100) for percent */
    value: integer("value").notNull(),
    minimumSubtotal: integer("minimum_subtotal").notNull().default(0),
    maximumDiscount: integer("maximum_discount"),
    startsAt: text("starts_at"),
    expiresAt: text("expires_at"),
    usageLimit: integer("usage_limit"),
    usageCount: integer("usage_count").notNull().default(0),
    perCustomerLimit: integer("per_customer_limit"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("coupons_code_unique").on(table.code),
    index("coupons_active_idx").on(table.isActive),
  ],
);

export const promotions = sqliteTable(
  "promotions",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    campaignType: text("campaign_type").notNull().default("seasonal"),
    discountType: text("discount_type").notNull().default("percent"),
    value: integer("value").notNull().default(0),
    minimumSubtotal: integer("minimum_subtotal").notNull().default(0),
    startsAt: text("starts_at"),
    expiresAt: text("expires_at"),
    bannerText: text("banner_text"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("promotions_slug_unique").on(table.slug)],
);

// ============================================================================
// DOMAIN 7 — ORDERS & ORDER-REQUEST PROCESSING (6 Tables + Coupon Redemptions)
// ============================================================================

export const orderReferenceSequences = sqliteTable("order_reference_sequences", {
  year: integer("year").primaryKey(),
  prefix: text("prefix").notNull().default("DODOX"),
  lastNumber: integer("last_number").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    reference: text("reference").notNull(),
    trackingTokenHash: text("tracking_token_hash").notNull(),
    idempotencyKey: text("idempotency_key"),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    /**
     * received | under_review | confirmed | in_production | ready |
     * out_for_delivery | delivered | cancelled | rejected
     */
    status: text("status").notNull().default("received"),
    /**
     * Future payment seam: Release 1 uses 'unpaid_request' exclusively.
     */
    paymentStatus: text("payment_status").notNull().default("unpaid_request"),
    paymentProvider: text("payment_provider"),
    paymentReference: text("payment_reference"),
    currency: text("currency").notNull().default("RWF"),
    itemCount: integer("item_count").notNull(),
    subtotalAmount: integer("subtotal_amount").notNull(),
    discountAmount: integer("discount_amount").notNull().default(0),
    couponId: text("coupon_id").references(() => coupons.id, {
      onDelete: "set null",
    }),
    couponCode: text("coupon_code"),
    careProtectionEnabled: integer("care_protection_enabled", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    careProtectionAmount: integer("care_protection_amount")
      .notNull()
      .default(0),
    deliveryMethod: text("delivery_method").notNull(),
    deliveryAmount: integer("delivery_amount").notNull().default(0),
    vatRateBps: integer("vat_rate_bps").notNull().default(1800),
    pricesIncludeVat: integer("prices_include_vat", { mode: "boolean" })
      .notNull()
      .default(true),
    vatAmount: integer("vat_amount").notNull().default(0),
    totalAmount: integer("total_amount").notNull(),
    stockReserved: integer("stock_reserved", { mode: "boolean" })
      .notNull()
      .default(false),
    customerFirstName: text("customer_first_name").notNull(),
    customerLastName: text("customer_last_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerNotes: text("customer_notes"),
    confirmedAt: text("confirmed_at"),
    inProductionAt: text("in_production_at"),
    readyAt: text("ready_at"),
    deliveredAt: text("delivered_at"),
    cancelledAt: text("cancelled_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("orders_reference_unique").on(table.reference),
    uniqueIndex("orders_idempotency_unique").on(table.idempotencyKey),
    index("orders_customer_idx").on(table.customerId),
    index("orders_email_idx").on(table.customerEmail),
    index("orders_status_created_idx").on(table.status, table.createdAt),
    index("orders_created_idx").on(table.createdAt),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: text("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    productSlug: text("product_slug").notNull(),
    productName: text("product_name").notNull(),
    productSku: text("product_sku"),
    productImage: text("product_image").notNull(),
    availabilityAtOrder: text("availability_at_order").notNull(),
    leadTimeAtOrder: text("lead_time_at_order").notNull(),
    baseUnitPrice: integer("base_unit_price").notNull(),
    variantPriceDelta: integer("variant_price_delta").notNull().default(0),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
    selectedOptionsJson: text("selected_options_json").notNull().default("[]"),
    variantSummary: text("variant_summary").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    index("order_items_product_idx").on(table.productId),
  ],
);

export const orderStatusHistory = sqliteTable(
  "order_status_history",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    note: text("note"),
    isCustomerVisible: integer("is_customer_visible", { mode: "boolean" })
      .notNull()
      .default(true),
    changedByUserId: text("changed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("order_status_history_order_idx").on(table.orderId, table.createdAt),
  ],
);

export const orderNotes = sqliteTable(
  "order_notes",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text("note").notNull(),
    isInternal: integer("is_internal", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("order_notes_order_idx").on(table.orderId, table.createdAt)],
);

export const orderAddresses = sqliteTable(
  "order_addresses",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    addressType: text("address_type").notNull().default("delivery"),
    recipientName: text("recipient_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    city: text("city").notNull(),
    district: text("district").notNull(),
    addressLine: text("address_line").notNull(),
    landmark: text("landmark"),
    country: text("country").notNull().default("Rwanda"),
  },
  (table) => [index("order_addresses_order_idx").on(table.orderId)],
);

export const couponRedemptions = sqliteTable(
  "coupon_redemptions",
  {
    id: text("id").primaryKey(),
    couponId: text("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    customerEmail: text("customer_email").notNull(),
    discountAmount: integer("discount_amount").notNull(),
    redeemedAt: text("redeemed_at").notNull(),
  },
  (table) => [
    index("coupon_redemptions_coupon_idx").on(table.couponId),
    index("coupon_redemptions_email_idx").on(
      table.couponId,
      table.customerEmail,
    ),
  ],
);

// ============================================================================
// DOMAIN 8 — WEBSITE CONTENT & SETTINGS (8 Tables)
// ============================================================================

export const pages = sqliteTable(
  "pages",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    eyebrow: text("eyebrow"),
    excerpt: text("excerpt"),
    contentJson: text("content_json").notNull().default("[]"),
    heroImageUrl: text("hero_image_url"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    status: text("status").notNull().default("published"),
    publishedAt: text("published_at"),
    updatedByUserId: text("updated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("pages_slug_unique").on(table.slug)],
);

export const journalPosts = sqliteTable(
  "journal_posts",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    category: text("category").notNull(),
    readTime: text("read_time").notNull().default("5 min read"),
    publishedDate: text("published_date").notNull(),
    imageUrl: text("image_url").notNull(),
    imageAlt: text("image_alt").notNull().default(""),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    bodyJson: text("body_json").notNull().default("[]"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    isSample: integer("is_sample", { mode: "boolean" }).notNull().default(true),
    status: text("status").notNull().default("published"),
    authorUserId: text("author_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("journal_posts_slug_unique").on(table.slug),
    index("journal_posts_status_date_idx").on(table.status, table.publishedDate),
  ],
);

export const testimonials = sqliteTable(
  "testimonials",
  {
    id: text("id").primaryKey(),
    quote: text("quote").notNull(),
    author: text("author").notNull(),
    initials: text("initials").notNull(),
    location: text("location").notNull(),
    pieceName: text("piece_name").notNull(),
    rating: integer("rating").notNull().default(5),
    isSample: integer("is_sample", { mode: "boolean" }).notNull().default(true),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("testimonials_published_sort_idx").on(
      table.isPublished,
      table.sortOrder,
    ),
  ],
);

export const navigationItems = sqliteTable(
  "navigation_items",
  {
    id: text("id").primaryKey(),
    menuLocation: text("menu_location").notNull(),
    parentId: text("parent_id").references(
      (): AnySQLiteColumn => navigationItems.id,
      { onDelete: "cascade" },
    ),
    label: text("label").notNull(),
    href: text("href").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("navigation_items_loc_sort_idx").on(
      table.menuLocation,
      table.sortOrder,
    ),
  ],
);

export const homepageSections = sqliteTable(
  "homepage_sections",
  {
    id: text("id").primaryKey(),
    sectionKey: text("section_key").notNull(),
    eyebrow: text("eyebrow"),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    primaryCtaLabel: text("primary_cta_label"),
    primaryCtaHref: text("primary_cta_href"),
    secondaryCtaLabel: text("secondary_cta_label"),
    secondaryCtaHref: text("secondary_cta_href"),
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    metadataJson: text("metadata_json").notNull().default("{}"),
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(true),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("homepage_sections_key_unique").on(table.sectionKey),
    index("homepage_sections_sort_idx").on(table.isPublished, table.sortOrder),
  ],
);

export const banners = sqliteTable(
  "banners",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    placement: text("placement").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    ctaLabel: text("cta_label"),
    ctaHref: text("cta_href"),
    imageUrl: text("image_url"),
    themeVariant: text("theme_variant").notNull().default("ink"),
    startsAt: text("starts_at"),
    expiresAt: text("expires_at"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("banners_slug_unique").on(table.slug),
    index("banners_placement_idx").on(table.placement, table.isActive),
  ],
);

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  valueJson: text("value_json").notNull(),
  groupName: text("group_name").notNull().default("general"),
  label: text("label").notNull(),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  updatedByUserId: text("updated_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: text("updated_at").notNull(),
});

export const faqs = sqliteTable(
  "faqs",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull().default("general"),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("faqs_category_sort_idx").on(
      table.category,
      table.isPublished,
      table.sortOrder,
    ),
  ],
);

// ============================================================================
// DOMAIN 9 — CUSTOMER ENQUIRIES & NEWSLETTER (3 Tables)
// ============================================================================

export const contactMessages = sqliteTable(
  "contact_messages",
  {
    id: text("id").primaryKey(),
    reference: text("reference").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    status: text("status").notNull().default("new"),
    internalNotes: text("internal_notes"),
    assignedToUserId: text("assigned_to_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ipHash: text("ip_hash"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("contact_messages_ref_unique").on(table.reference),
    index("contact_messages_status_idx").on(table.status, table.createdAt),
  ],
);

export const atelierEnquiries = sqliteTable(
  "atelier_enquiries",
  {
    id: text("id").primaryKey(),
    reference: text("reference").notNull(),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    furnitureType: text("furniture_type").notNull(),
    dimensions: text("dimensions").notNull(),
    materials: text("materials").notNull(),
    finish: text("finish").notNull(),
    budget: text("budget").notNull(),
    description: text("description").notNull(),
    contactPreference: text("contact_preference").notNull().default("email"),
    referenceImagesJson: text("reference_images_json").notNull().default("[]"),
    quotedAmount: integer("quoted_amount"),
    /**
     * new | reviewing | quotation_prepared | awaiting_customer |
     * accepted | in_production | completed | rejected
     */
    status: text("status").notNull().default("new"),
    isArchived: integer("is_archived", { mode: "boolean" })
      .notNull()
      .default(false),
    internalNotes: text("internal_notes"),
    assignedToUserId: text("assigned_to_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ipHash: text("ip_hash"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("atelier_enquiries_ref_unique").on(table.reference),
    index("atelier_enquiries_status_idx").on(
      table.isArchived,
      table.status,
      table.createdAt,
    ),
  ],
);

export const newsletterSubscribers = sqliteTable(
  "newsletter_subscribers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    status: text("status").notNull().default("active"),
    consentGiven: integer("consent_given", { mode: "boolean" })
      .notNull()
      .default(true),
    consentText: text("consent_text").notNull(),
    consentSource: text("consent_source").notNull().default("storefront"),
    consentedAt: text("consented_at").notNull(),
    unsubscribeToken: text("unsubscribe_token").notNull(),
    unsubscribedAt: text("unsubscribed_at"),
    ipHash: text("ip_hash"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("newsletter_subscribers_email_unique").on(table.email),
    uniqueIndex("newsletter_subscribers_token_unique").on(
      table.unsubscribeToken,
    ),
    index("newsletter_subscribers_status_idx").on(table.status),
  ],
);

// ============================================================================
// DOMAIN 10 — ADMINISTRATION, AUDIT LOGS & RATE LIMITING (4 Tables)
// ============================================================================

export const activityLogs = sqliteTable(
  "activity_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    summary: text("summary").notNull(),
    beforeJson: text("before_json"),
    afterJson: text("after_json"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("activity_logs_created_idx").on(table.createdAt),
    index("activity_logs_actor_idx").on(table.actorUserId),
    index("activity_logs_resource_idx").on(table.resourceType, table.resourceId),
  ],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    recipientUserId: text("recipient_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    category: text("category").notNull().default("system"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    readAt: text("read_at"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("notifications_read_created_idx").on(table.isRead, table.createdAt),
    index("notifications_recipient_idx").on(table.recipientUserId),
  ],
);

export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  valueJson: text("value_json").notNull(),
  description: text("description").notNull().default(""),
  updatedByUserId: text("updated_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: text("updated_at").notNull(),
});

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    bucketKey: text("bucket_key").primaryKey(),
    hitCount: integer("hit_count").notNull().default(0),
    windowStartedAt: integer("window_started_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [index("rate_limits_expires_idx").on(table.expiresAt)],
);
