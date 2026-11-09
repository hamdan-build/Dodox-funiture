export type CategorySlug =
  | "living-room"
  | "bedroom"
  | "dining-room"
  | "home-office"
  | "outdoor";

export type Availability = "in-stock" | "made-to-order" | "pre-order";

export interface Category {
  slug: CategorySlug;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  image: string;
  alt: string;
}

export interface ImageAsset {
  src: string;
  alt: string;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export interface VariantOption {
  id: string;
  label: string;
  helper?: string;
  /** Price difference in RWF relative to the product base price. */
  priceDelta: number;
  swatch?: string;
  leadTime?: string;
}

export interface VariantGroup {
  id: string;
  label: string;
  helper?: string;
  options: VariantOption[];
}

export interface DimensionRow {
  label: string;
  value: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductReview {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
  tag?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  subtitle: string;
  description: string;
  story: string;
  price: number;
  compareAtPrice?: number;
  images: ImageAsset[];
  materials: string[];
  colors: ColorOption[];
  dimensions: DimensionRow[];
  variants: VariantGroup[];
  availability: Availability;
  leadTime: string;
  featured?: boolean;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  specs: ProductSpec[];
  care: string[];
  seating?: number;
  collection?: string;
  tags?: string[];
}

export interface SelectedVariant {
  groupId: string;
  groupLabel: string;
  optionId: string;
  optionLabel: string;
  priceDelta: number;
}

export interface CartItem {
  key: string;
  productId: string;
  slug: string;
  name: string;
  category: CategorySlug;
  image: string;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  selections: SelectedVariant[];
  availability: Availability;
  leadTime: string;
}

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  category: CategorySlug;
  availability: Availability;
  addedAt: number;
}

export type DiscountType = "fixed" | "percent";

export interface PromoCode {
  code: string;
  type: DiscountType;
  value: number;
  label: string;
  minimumSubtotal?: number;
  description: string;
}

export interface AppliedPromo {
  code: string;
  label: string;
  amount: number;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discount: number;
  careProtection: number;
  logistics: number;
  total: number;
  vatIncluded: number;
  savings: number;
}

export type DeliveryMethod = "kigali-white-glove" | "regional-courier";

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  landmark?: string;
  deliveryMethod: DeliveryMethod;
  notes?: string;
}

export interface OrderLine {
  name: string;
  slug: string;
  image: string;
  quantity: number;
  unitPrice: number;
  variantSummary: string;
}

export interface OrderRecord {
  reference: string;
  createdAt: string;
  status: "received" | "atelier-review" | "in-production" | "ready";
  customer: CustomerDetails;
  lines: OrderLine[];
  totals: CartTotals;
  careProtection: boolean;
  promoCode?: string;
}

export interface JournalPost {
  slug: string;
  title: string;
  excerpt: string;
  category: "Atelier Notes" | "Material Studies" | "Room Stories" | "Care & Longevity";
  readTime: string;
  date: string;
  image: string;
  alt: string;
  featured?: boolean;
  body: { type: "paragraph" | "heading" | "quote"; text: string }[];
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  initials: string;
  location: string;
  piece: string;
}
