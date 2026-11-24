export const PERMISSIONS = [
  {
    key: "products.read",
    module: "products",
    description: "View products, variants, specifications, and catalogue pricing",
  },
  {
    key: "products.create",
    module: "products",
    description: "Create new furniture pieces and variants",
  },
  {
    key: "products.update",
    module: "products",
    description: "Edit product details, pricing, availability, and publishing",
  },
  {
    key: "products.delete",
    module: "products",
    description: "Archive or permanently delete products",
  },
  {
    key: "categories.manage",
    module: "categories",
    description: "Create, edit, reorder, and publish categories and collections",
  },
  {
    key: "orders.read",
    module: "orders",
    description: "View order requests, customer details, and status history",
  },
  {
    key: "orders.update",
    module: "orders",
    description: "Update order statuses and add internal concierge notes",
  },
  {
    key: "orders.export",
    module: "orders",
    description: "Export order data to CSV",
  },
  {
    key: "inventory.manage",
    module: "inventory",
    description: "Manage stock levels, adjustments, suppliers, and purchase orders",
  },
  {
    key: "customers.read",
    module: "customers",
    description: "View customer profiles, addresses, and order histories",
  },
  {
    key: "customers.update",
    module: "customers",
    description: "Edit customer details and record internal customer notes",
  },
  {
    key: "promotions.manage",
    module: "promotions",
    description: "Create and manage discount coupons and promotional campaigns",
  },
  {
    key: "enquiries.manage",
    module: "enquiries",
    description: "Manage Atelier commissions, contact messages, and newsletter subscribers",
  },
  {
    key: "content.manage",
    module: "content",
    description: "Publish and edit journal posts, homepage sections, banners, FAQs, pages, and navigation",
  },
  {
    key: "media.manage",
    module: "media",
    description: "Upload, edit metadata, and delete files in the R2 Media Library",
  },
  {
    key: "settings.manage",
    module: "settings",
    description: "Update website business settings, VAT, currency, and delivery configuration",
  },
  {
    key: "reports.read",
    module: "reports",
    description: "Access sales, order, product, inventory, and enquiry reports",
  },
  {
    key: "staff.manage",
    module: "staff",
    description: "Create staff accounts, assign roles, and review audit logs",
  },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export type RoleSlug =
  | "super_admin"
  | "administrator"
  | "store_manager"
  | "product_manager"
  | "inventory_manager"
  | "order_manager"
  | "content_editor"
  | "customer_support";

const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map((p) => p.key);

export const ROLE_DEFINITIONS: {
  slug: RoleSlug;
  name: string;
  description: string;
  permissions: PermissionKey[];
}[] = [
  {
    slug: "super_admin",
    name: "Super Admin",
    description: "Unrestricted control over platform, security, staff, and configuration.",
    permissions: ALL_PERMISSION_KEYS,
  },
  {
    slug: "administrator",
    name: "Administrator",
    description: "Full operational administration across commerce, content, settings, and staff.",
    permissions: ALL_PERMISSION_KEYS,
  },
  {
    slug: "store_manager",
    name: "Store Manager",
    description: "Manages showroom catalogue, orders, inventory, promotions, enquiries, and reports.",
    permissions: [
      "products.read",
      "products.create",
      "products.update",
      "categories.manage",
      "orders.read",
      "orders.update",
      "orders.export",
      "inventory.manage",
      "customers.read",
      "customers.update",
      "promotions.manage",
      "enquiries.manage",
      "media.manage",
      "reports.read",
    ],
  },
  {
    slug: "product_manager",
    name: "Product Manager",
    description: "Manages furniture catalogue, variants, categories, collections, and media.",
    permissions: [
      "products.read",
      "products.create",
      "products.update",
      "products.delete",
      "categories.manage",
      "media.manage",
    ],
  },
  {
    slug: "inventory_manager",
    name: "Inventory Manager",
    description: "Manages showroom & atelier stock, adjustments, suppliers, and purchase orders.",
    permissions: ["products.read", "inventory.manage", "reports.read"],
  },
  {
    slug: "order_manager",
    name: "Order Manager",
    description: "Reviews, confirms, schedules, and exports customer order requests.",
    permissions: [
      "products.read",
      "orders.read",
      "orders.update",
      "orders.export",
      "inventory.manage",
      "customers.read",
      "customers.update",
    ],
  },
  {
    slug: "content_editor",
    name: "Content Editor",
    description: "Manages journal articles, homepage blocks, banners, testimonials, FAQs, and media.",
    permissions: ["products.read", "content.manage", "media.manage"],
  },
  {
    slug: "customer_support",
    name: "Customer Support",
    description: "Handles concierge contact messages, Atelier enquiries, newsletter, and customer lookup.",
    permissions: [
      "products.read",
      "orders.read",
      "customers.read",
      "customers.update",
      "enquiries.manage",
    ],
  },
];
