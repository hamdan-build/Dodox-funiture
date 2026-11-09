import type { PromoCode } from "@/types";

/**
 * Central site configuration.
 *
 * NOTE ON VERIFIED CONTENT
 * This is a frontend demonstration storefront. Contact details, opening hours,
 * delivery promises and other business facts below are placeholders that must
 * be replaced with verified information before launch. They are intentionally
 * kept in one file so they can be swapped without touching components.
 */

const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE,
  address: process.env.NEXT_PUBLIC_SHOWROOM_ADDRESS,
  hours: process.env.NEXT_PUBLIC_SHOWROOM_HOURS,
};

export const siteConfig = {
  name: "DODOX Furniture",
  shortName: "DODOX",
  wordmark: "DODOX",
  wordmarkSuffix: "FURNITURE",
  title: "DODOX Furniture — Handcrafted furniture for Kigali homes",
  description:
    "A considered collection of handcrafted furniture for modern Rwandan homes. Explore sculptural seating, solid timber tables and bespoke pieces from the DODOX atelier.",
  url: (env.siteUrl || "https://dodox-furniture.netlify.app").replace(/\/$/, ""),
  locale: "en_RW",
  currency: "RWF",
  currencyLabel: "Rwandan Franc",
  contact: {
    email: env.email || "concierge@dodox.rw",
    phone: env.phone || "+250 788 000 000",
    phoneHref: `tel:${(env.phone || "+250788000000").replace(/[^+\d]/g, "")}`,
    whatsappNumber: (env.whatsapp || "250788000000").replace(/[^\d]/g, ""),
    whatsappMessage:
      "Hello DODOX Atelier — I would like to ask about a piece from your collection.",
    showroomAddress:
      env.address || "KG 9 Ave, Nyarutarama, Kigali, Rwanda",
    showroomHours: env.hours || "Monday – Saturday, 09:00 – 19:00",
    city: "Kigali",
    country: "Rwanda",
  },
  social: {
    instagram: "https://www.instagram.com/",
    pinterest: "https://www.pinterest.com/",
  },
  announcement: [
    "Complimentary white-glove delivery & assembly across Kigali",
    "Visit the Nyarutarama showroom · Monday – Saturday",
    "Atelier order requests confirmed within one working day",
  ],
  demoNotice:
    "Demonstration storefront — product data, pricing and imagery are sample content. No payment is taken online.",
} as const;

export const whatsappLink = `https://wa.me/${siteConfig.contact.whatsappNumber}?text=${encodeURIComponent(
  siteConfig.contact.whatsappMessage,
)}`;

export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
}

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Furniture Catalog",
    href: "/shop",
    children: [
      {
        label: "All Furniture",
        href: "/shop",
        description: "The complete DODOX collection",
      },
      {
        label: "Living Room",
        href: "/shop?category=living-room",
        description: "Sculptural seating, tables and objects",
      },
      {
        label: "Bedroom",
        href: "/shop?category=bedroom",
        description: "Platform beds, wardrobes and linens",
      },
      {
        label: "Dining Room",
        href: "/shop?category=dining-room",
        description: "Solid timber tables and woven chairs",
      },
      {
        label: "Home Office",
        href: "/shop?category=home-office",
        description: "Desks, task chairs and shelving",
      },
      {
        label: "Outdoor Living",
        href: "/shop?category=outdoor",
        description: "Terrace lounging in teak and cane",
      },
    ],
  },
  { label: "Living Room", href: "/shop?category=living-room" },
  { label: "Dining Room", href: "/shop?category=dining-room" },
  { label: "Custom Atelier", href: "/custom-atelier" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
];

export const footerNav = [
  {
    title: "Collections",
    links: [
      { label: "Living Room", href: "/shop?category=living-room" },
      { label: "Dining Room", href: "/shop?category=dining-room" },
      { label: "Bedroom Sanctuary", href: "/shop?category=bedroom" },
      { label: "Home Office", href: "/shop?category=home-office" },
      { label: "Outdoor Living", href: "/shop?category=outdoor" },
      { label: "Custom Atelier", href: "/custom-atelier" },
    ],
  },
  {
    title: "Client Services",
    links: [
      { label: "White-Glove Assembly", href: "/about#white-glove" },
      { label: "Material Swatches & Timber Samples", href: "/contact" },
      { label: "Private Showroom Consultation", href: "/contact" },
      { label: "10-Year Craftsmanship Warranty", href: "/about#warranty" },
      { label: "Order Tracking", href: "/track-order" },
      { label: "Regional & Kigali Shipping Policy", href: "/contact#shipping" },
    ],
  },
  {
    title: "The House",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "The Journal", href: "/journal" },
      { label: "Contact & Showroom", href: "/contact" },
      { label: "Track an Order", href: "/track-order" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Shopping Bag", href: "/cart" },
    ],
  },
];

export const serviceFeatures = [
  {
    title: "100% Solid Hardwood",
    description: "Responsibly sourced East African timber",
    icon: "tree" as const,
  },
  {
    title: "Free Kigali White-Glove",
    description: "Delivery, placement & assembly",
    icon: "truck" as const,
  },
  {
    title: "10-Year Warranty",
    description: "Structural & joinery guarantee",
    icon: "shield" as const,
  },
  {
    title: "Kigali Showroom",
    description: "KG 9 Ave, Nyarutarama, open daily",
    icon: "store" as const,
  },
];

export const dodoxStandard = [
  {
    title: "Quality Craftsmanship",
    description:
      "Joinery, carving and finishing executed by hand in the atelier, with every frame inspected before it leaves the bench.",
    icon: "hammer" as const,
  },
  {
    title: "Contemporary Design",
    description:
      "Silhouettes drawn for modern African and global interiors — architectural lines, tactile upholstery, honest materials.",
    icon: "compass" as const,
  },
  {
    title: "Effortless Local Payment",
    description:
      "Order requests are reviewed by the atelier concierge, who confirms local payment and delivery arrangements directly with you.",
    icon: "wallet" as const,
  },
  {
    title: "White-Glove Delivery",
    description:
      "Room-of-choice placement, assembly and packaging removal coordinated with our Kigali delivery team.",
    icon: "package" as const,
  },
];

export const atelierWorkflow = [
  {
    step: "01",
    title: "Design Consultation",
    description:
      "Share your room dimensions, reference images and the way you live. We translate them into a measured furniture proposal.",
  },
  {
    step: "02",
    title: "Curation & Material Approval",
    description:
      "Review timber samples, fabric swatches and finish options, then approve the final specification and quotation.",
  },
  {
    step: "03",
    title: "Artisan Crafting & White-Glove Installation",
    description:
      "Your piece is built to order in the atelier, inspected, then delivered, placed and assembled in your home.",
  },
];

export const timberSwatches = [
  { name: "African Teak", note: "Warm gold", hex: "#9a6f43" },
  { name: "Mahogany", note: "Deep amber", hex: "#6f3f2a" },
  { name: "White Oak", note: "Pale oat", hex: "#c8ae8a" },
  { name: "Smoked Ash", note: "Charcoal brown", hex: "#4a3a30" },
];

export const careSteps = [
  {
    title: "Dust with a soft, dry cloth",
    description:
      "Work with the grain of the timber weekly. Avoid silicone polishes and abrasive pads.",
  },
  {
    title: "Keep out of direct sun",
    description:
      "Natural timber deepens in tone over time; rotate accessories and avoid prolonged direct sunlight.",
  },
  {
    title: "Address spills promptly",
    description:
      "Blot — do not rub — with a dry cloth. For oiled surfaces, a maintenance kit can be requested from the atelier.",
  },
  {
    title: "Arrange a care visit",
    description:
      "Our team can inspect joinery and refresh finishes in person; schedule through the concierge.",
  },
];

export const demoPromoCodes: PromoCode[] = [
  {
    code: "WELCOMEKIGALI",
    type: "fixed",
    value: 100000,
    label: "Showroom Inaugural Privilege",
    minimumSubtotal: 500000,
    description: "100,000 RWF off orders over 500,000 RWF.",
  },
  {
    code: "ATELIER10",
    type: "percent",
    value: 10,
    label: "Atelier Privilege",
    description: "10% off the piece subtotal — demonstration code.",
  },
];

export const careProtection = {
  price: 65000,
  title: "5-Year Atelier Care Protection",
  description:
    "Extends cover to accidental spills, fibre tearing on bouclé and moisture rings on natural timber, with two in-home polish visits.",
};

export const privilegeThreshold = 2000000;
