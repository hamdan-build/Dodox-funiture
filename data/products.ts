import type { Product } from "@/types";

/**
 * SAMPLE CATALOGUE DATA
 * ---------------------
 * Prices, dimensions, inventory levels and lead times below are illustrative
 * demonstration values (RWF). They are centralised here so they can be replaced
 * with verified atelier data without editing any component.
 */

const careTimber = [
  "Dust weekly with a soft, dry cloth, following the grain.",
  "Keep away from prolonged direct sunlight and direct heat sources.",
  "Blot spills immediately; avoid silicone-based polishes.",
  "Request an atelier maintenance visit through the concierge.",
];

const careUpholstery = [
  "Vacuum upholstery monthly with a soft brush attachment.",
  "Rotate and plump cushions to distribute wear evenly.",
  "Blot — never rub — spills with a clean, dry cloth.",
  "Professional dry cleaning is recommended for deeper marks.",
];

export const products: Product[] = [
  {
    id: "prod-imanzi-sofa",
    slug: "imanzi-sculptural-boucle-sofa",
    name: "Imanzi Sculptural Bouclé Sofa",
    category: "living-room",
    subtitle: "Warm Sand Bouclé · Solid Natural Oak Plinth",
    description:
      "A fluid, wave-inspired silhouette grounded by a solid oak plinth. Sculpted with high-resilience ergonomic contours and enveloped in textured loop bouclé.",
    story:
      "The Imanzi is drawn as a single continuous gesture — a low, sculptural curve that invites conversation without closing the room. Each frame is shaped and dowelled by hand, then floated on a solid timber plinth so the piece appears to rest lightly on the floor.",
    price: 1450000,
    compareAtPrice: 1650000,
    images: [
      {
        src: "/images/products/imanzi-sofa.jpg",
        alt: "Imanzi sculptural bouclé sofa on a natural oak plinth against an ivory plaster wall",
      },
      {
        src: "/images/hero/hero-living-room.jpg",
        alt: "Imanzi sofa styled in a warm living room overlooking the Kigali hills at dusk",
      },
      {
        src: "/images/products/imanzi-fabric.jpg",
        alt: "Close detail of the textured sand bouclé upholstery",
      },
      {
        src: "/images/editorial/gallery-sofa.jpg",
        alt: "Curved loveseat silhouette in a quiet gallery-like room",
      },
    ],
    materials: ["Bouclé", "Solid Oak"],
    colors: [
      { name: "Warm Sand", hex: "#cbb69a" },
      { name: "Ivory Mist", hex: "#e6ddce" },
      { name: "Nyungwe Olive", hex: "#6d6a4d" },
      { name: "Volcanic Ash", hex: "#4e4943" },
    ],
    dimensions: [
      { label: "3-Seater width", value: "230 cm" },
      { label: "Overall depth", value: "98 cm" },
      { label: "Seat height", value: "44 cm" },
      { label: "Backrest height", value: "76 cm" },
    ],
    variants: [
      {
        id: "upholstery",
        label: "Upholstery",
        helper: "Stain-guarded with natural plant wax repellent",
        options: [
          {
            id: "warm-sand",
            label: "Warm Sand",
            helper: "Heavy rub tested bouclé",
            priceDelta: 0,
            swatch: "#cbb69a",
          },
          {
            id: "ivory-mist",
            label: "Ivory Mist",
            helper: "Heavy rub tested bouclé",
            priceDelta: 0,
            swatch: "#e6ddce",
          },
          {
            id: "nyungwe-olive",
            label: "Nyungwe Olive",
            helper: "Imported wool blend",
            priceDelta: 45000,
            swatch: "#6d6a4d",
          },
          {
            id: "volcanic-ash",
            label: "Volcanic Ash",
            helper: "Imported wool blend",
            priceDelta: 45000,
            swatch: "#4e4943",
          },
        ],
      },
      {
        id: "configuration",
        label: "Dimensions & Scale",
        helper: "Every configuration is built to order in the atelier",
        options: [
          {
            id: "three-seater",
            label: "3-Seater",
            helper: "230 cm · Standard",
            priceDelta: 0,
          },
          {
            id: "four-seater",
            label: "4-Seater XL",
            helper: "270 cm · Expansive",
            priceDelta: 350000,
          },
          {
            id: "l-sectional",
            label: "L-Sectional",
            helper: "310 × 180 cm",
            priceDelta: 700000,
          },
        ],
      },
      {
        id: "plinth",
        label: "Plinth Base",
        options: [
          {
            id: "natural-oak",
            label: "Natural Oak",
            helper: "Sustainably harvested",
            priceDelta: 0,
            swatch: "#b08a5c",
          },
          {
            id: "smoked-walnut",
            label: "Smoked Walnut",
            priceDelta: 85000,
            swatch: "#5a4233",
          },
          {
            id: "brushed-brass",
            label: "Brushed Brass",
            priceDelta: 140000,
            swatch: "#b39a6a",
          },
        ],
      },
    ],
    availability: "made-to-order",
    leadTime: "10–14 days",
    featured: true,
    badge: "Signature Piece",
    rating: 4.9,
    reviewCount: 48,
    specs: [
      { label: "Frame", value: "Kiln-dried Rwandan eucalyptus hardwood" },
      { label: "Suspension", value: "Dual-density memory foam over elastic webbing" },
      { label: "Upholstery", value: "39,000 rub Martindale bouclé" },
      { label: "Joinery", value: "Dowelled, corner-blocked and braced" },
      { label: "Finish", value: "Hand-rubbed natural oil" },
      { label: "Origin", value: "Atelier-built sample specification" },
    ],
    care: careUpholstery,
    seating: 3,
    collection: "Imanzi Series",
    tags: ["sofa", "boucle", "curved", "living room", "seating"],
  },
  {
    id: "prod-kigali-coffee-table",
    slug: "kigali-oak-coffee-table",
    name: "Kigali Oak Coffee Table",
    category: "living-room",
    subtitle: "Natural Oak Matte Finish · Beveled Architectural Profile",
    description:
      "A generous round table carved from solid oak, with a beveled edge and a fluted pedestal that echoes the timber columns of the atelier.",
    story:
      "Turned from a single oak blank and finished by hand, the Kigali table is designed to sit low beside deep seating. The fluted base is cut on the bench, one reed at a time.",
    price: 380000,
    images: [
      {
        src: "/images/products/kigali-oak-coffee-table.jpg",
        alt: "Round solid oak coffee table with fluted pedestal base and ceramic vase",
      },
      {
        src: "/images/rooms/living-room.jpg",
        alt: "Oak coffee table styled beside a curved cream sofa",
      },
    ],
    materials: ["Solid Oak"],
    colors: [
      { name: "Natural Oak", hex: "#c1a276" },
      { name: "Smoked Oak", hex: "#6d5844" },
    ],
    dimensions: [
      { label: "Diameter", value: "110 cm" },
      { label: "Height", value: "34 cm" },
      { label: "Top thickness", value: "4.5 cm" },
    ],
    variants: [
      {
        id: "size",
        label: "Diameter",
        options: [
          { id: "110", label: "110 cm", helper: "Standard", priceDelta: 0 },
          { id: "130", label: "130 cm", helper: "Grand", priceDelta: 95000 },
          { id: "150", label: "150 cm", helper: "Salon", priceDelta: 180000 },
        ],
      },
      {
        id: "finish",
        label: "Finish",
        options: [
          {
            id: "natural",
            label: "Natural Oak",
            priceDelta: 0,
            swatch: "#c1a276",
          },
          {
            id: "smoked",
            label: "Smoked Oak",
            helper: "Deeper, fumed tone",
            priceDelta: 30000,
            swatch: "#6d5844",
          },
        ],
      },
    ],
    availability: "in-stock",
    leadTime: "Immediate dispatch within 48 hours",
    featured: true,
    badge: "New Arrival",
    rating: 4.8,
    reviewCount: 26,
    specs: [
      { label: "Material", value: "Solid kiln-dried oak" },
      { label: "Top", value: "Single-plank look, beveled edge" },
      { label: "Base", value: "Hand-fluted pedestal" },
      { label: "Finish", value: "Matte hardwax oil" },
      { label: "Weight", value: "38 kg (110 cm)" },
    ],
    care: careTimber,
    collection: "Kigali Series",
    tags: ["coffee table", "oak", "round", "living room"],
  },
  {
    id: "prod-virunga-bed",
    slug: "virunga-king-platform-bed",
    name: "Virunga King Platform Bed",
    category: "bedroom",
    subtitle: "Natural Oak · Ivory Linen Upholstered Headboard",
    description:
      "A low platform bed with a gently curved headboard and a solid oak frame, designed to keep the bedroom calm and close to the floor.",
    story:
      "The Virunga is built around a slatted oak platform with a softly upholstered headboard. The proportions are drawn for generous rooms, with a low profile that opens the view beyond the bed.",
    price: 1890000,
    compareAtPrice: 2100000,
    images: [
      {
        src: "/images/products/virunga-bed.jpg",
        alt: "Low oak platform bed with ivory linen bedding and woven pendant light",
      },
      {
        src: "/images/rooms/bedroom.jpg",
        alt: "Virunga bed in a tranquil bedroom with limewash walls",
      },
    ],
    materials: ["Solid Oak", "Linen"],
    colors: [
      { name: "Ivory Linen", hex: "#e3d9c8" },
      { name: "Sand Bouclé", hex: "#cbb69a" },
    ],
    dimensions: [
      { label: "King width", value: "200 cm" },
      { label: "Length", value: "220 cm" },
      { label: "Platform height", value: "30 cm" },
      { label: "Headboard height", value: "96 cm" },
    ],
    variants: [
      {
        id: "size",
        label: "Mattress Size",
        options: [
          { id: "queen", label: "Queen", helper: "160 × 200 cm", priceDelta: -150000 },
          { id: "king", label: "King", helper: "180 × 200 cm", priceDelta: 0 },
          {
            id: "california-king",
            label: "California King",
            helper: "200 × 210 cm",
            priceDelta: 220000,
          },
        ],
      },
      {
        id: "headboard",
        label: "Headboard Upholstery",
        options: [
          {
            id: "ivory",
            label: "Ivory Linen",
            priceDelta: 0,
            swatch: "#e3d9c8",
          },
          {
            id: "sand",
            label: "Sand Bouclé",
            priceDelta: 65000,
            swatch: "#cbb69a",
          },
        ],
      },
    ],
    availability: "made-to-order",
    leadTime: "3–4 weeks",
    featured: true,
    badge: "Showpiece",
    rating: 4.9,
    reviewCount: 31,
    specs: [
      { label: "Frame", value: "Solid oak platform with slatted base" },
      { label: "Headboard", value: "Belgian linen over high-resilience foam" },
      { label: "Finish", value: "Natural matt oil" },
      { label: "Assembly", value: "White-glove assembly included in Kigali" },
      { label: "Mattress", value: "Sold separately" },
    ],
    care: careTimber,
    collection: "Virunga Series",
    tags: ["bed", "oak", "platform", "bedroom"],
  },
  {
    id: "prod-akagera-dining-suite",
    slug: "akagera-six-seater-dining-suite",
    name: "Akagera Six-Seater Dining Suite",
    category: "dining-room",
    subtitle: "Solid Teak · Woven Cane Chairs · Natural Finish",
    description:
      "An architectural dining table in solid teak paired with six hand-woven cane chairs — composed for long meals and open rooms.",
    story:
      "The Akagera table is built with a chamfered edge that catches light along its length; the chairs are woven on the bench from natural cane over a solid teak frame.",
    price: 1120000,
    images: [
      {
        src: "/images/products/akagera-dining-suite.jpg",
        alt: "Solid teak dining table with woven cane chairs by a garden window",
      },
      {
        src: "/images/rooms/dining-room.jpg",
        alt: "Akagera dining suite styled in a warm dining room",
      },
    ],
    materials: ["Solid Teak", "Rattan & Cane"],
    colors: [
      { name: "Natural Teak", hex: "#a87a4e" },
      { name: "Smoked Teak", hex: "#6b4d36" },
    ],
    dimensions: [
      { label: "Table (6 seats)", value: "220 × 100 cm" },
      { label: "Height", value: "76 cm" },
      { label: "Chair seat height", value: "46 cm" },
    ],
    variants: [
      {
        id: "table",
        label: "Table Length",
        options: [
          { id: "220", label: "220 cm", helper: "Six seats", priceDelta: 0 },
          { id: "260", label: "260 cm", helper: "Eight seats", priceDelta: 180000 },
        ],
      },
      {
        id: "chairs",
        label: "Chair Count",
        options: [
          { id: "4", label: "Four chairs", priceDelta: -180000 },
          { id: "6", label: "Six chairs", priceDelta: 0 },
          { id: "8", label: "Eight chairs", priceDelta: 240000 },
        ],
      },
    ],
    availability: "made-to-order",
    leadTime: "4 weeks",
    featured: true,
    badge: "Atelier Made",
    rating: 4.8,
    reviewCount: 19,
    specs: [
      { label: "Table top", value: "Solid teak, 4 cm chamfered edge" },
      { label: "Chairs", value: "Solid teak frame with hand-woven cane" },
      { label: "Finish", value: "Hardwax oil, matte" },
      { label: "Seats", value: "Six as standard, up to eight" },
    ],
    care: [...careTimber, "Re-oil cane annually in dry seasons."],
    seating: 6,
    collection: "Akagera Series",
    tags: ["dining table", "teak", "chairs", "dining room"],
  },
  {
    id: "prod-gishwati-chair",
    slug: "gishwati-rattan-lounge-chair",
    name: "Gishwati Rattan Lounge Chair",
    category: "living-room",
    subtitle: "Natural Cane · Ivory Linen Cushion · Teak Frame",
    description:
      "A deep lounge chair in solid teak and hand-woven cane, with a linen cushion that softens its architectural frame.",
    story:
      "Woven in the atelier over three days, the Gishwati chair pairs a generous seat with a low, curved back. It is at home indoors and on a covered veranda.",
    price: 490000,
    compareAtPrice: 540000,
    images: [
      {
        src: "/images/products/gishwati-chair.jpg",
        alt: "Rattan and teak lounge chairs with linen cushions on a terrace",
      },
      {
        src: "/images/rooms/outdoor-living.jpg",
        alt: "Gishwati chairs arranged on a covered terrace",
      },
    ],
    materials: ["Rattan & Cane", "Solid Teak", "Linen"],
    colors: [
      { name: "Natural Cane", hex: "#c3a171" },
      { name: "Smoked Rattan", hex: "#6b533c" },
    ],
    dimensions: [
      { label: "Width", value: "78 cm" },
      { label: "Depth", value: "84 cm" },
      { label: "Seat height", value: "42 cm" },
      { label: "Back height", value: "74 cm" },
    ],
    variants: [
      {
        id: "frame",
        label: "Frame Finish",
        options: [
          { id: "natural", label: "Natural Cane", priceDelta: 0, swatch: "#c3a171" },
          { id: "smoked", label: "Smoked Rattan", priceDelta: 40000, swatch: "#6b533c" },
        ],
      },
      {
        id: "cushion",
        label: "Cushion",
        options: [
          { id: "ivory", label: "Ivory Linen", priceDelta: 0, swatch: "#e3d9c8" },
          { id: "sand", label: "Sand Bouclé", priceDelta: 25000, swatch: "#cbb69a" },
        ],
      },
    ],
    availability: "in-stock",
    leadTime: "In Kigali stock · dispatch within 48 hours",
    badge: "Limited Stock",
    rating: 4.7,
    reviewCount: 14,
    specs: [
      { label: "Frame", value: "Solid teak" },
      { label: "Seat", value: "Hand-woven natural cane" },
      { label: "Cushion", value: "Belgian linen over foam" },
      { label: "Use", value: "Indoor and covered outdoor" },
    ],
    care: [...careTimber, "Bring indoors during heavy rain."],
    collection: "Gishwati Series",
    tags: ["chair", "rattan", "cane", "lounge", "outdoor"],
  },
  {
    id: "prod-muhabura-desk",
    slug: "muhabura-executive-desk",
    name: "Muhabura Executive Desk",
    category: "home-office",
    subtitle: "Solid Walnut · Brushed Brass Cable Channel",
    description:
      "A calm, architectural desk in solid walnut, with a concealed cable channel and a hand-planed top that softens under lamplight.",
    story:
      "Drawn for a home study, the Muhabura desk has a generous working plane and a slender apron that keeps the sightline clear. The cable channel is lined in brushed brass and opened by hand.",
    price: 860000,
    images: [
      {
        src: "/images/products/muhabura-desk.jpg",
        alt: "Solid walnut executive desk with a sculptural chair and oak shelving",
      },
      {
        src: "/images/rooms/workspace.jpg",
        alt: "Walnut desk in a warm home study",
      },
    ],
    materials: ["Walnut"],
    colors: [
      { name: "Natural Walnut", hex: "#6c4c37" },
      { name: "Smoked Ash", hex: "#4a3a30" },
    ],
    dimensions: [
      { label: "Width", value: "160 cm" },
      { label: "Depth", value: "72 cm" },
      { label: "Height", value: "75 cm" },
      { label: "Apron height", value: "12 cm" },
    ],
    variants: [
      {
        id: "width",
        label: "Width",
        options: [
          { id: "160", label: "160 cm", priceDelta: 0 },
          { id: "180", label: "180 cm", priceDelta: 60000 },
          { id: "200", label: "200 cm", helper: "Executive", priceDelta: 120000 },
        ],
      },
      {
        id: "timber",
        label: "Timber",
        options: [
          { id: "walnut", label: "Natural Walnut", priceDelta: 0, swatch: "#6c4c37" },
          { id: "smoked-ash", label: "Smoked Ash", priceDelta: 0, swatch: "#4a3a30" },
        ],
      },
    ],
    availability: "made-to-order",
    leadTime: "3 weeks",
    badge: "Atelier Made",
    rating: 4.9,
    reviewCount: 11,
    specs: [
      { label: "Top", value: "Solid walnut, 3.5 cm" },
      { label: "Cable management", value: "Brass-lined rear channel" },
      { label: "Finish", value: "Hand-rubbed oil" },
      { label: "Assembly", value: "Legs attach with brass fixings" },
    ],
    care: careTimber,
    collection: "Muhabura Series",
    tags: ["desk", "walnut", "office", "study"],
  },
  {
    id: "prod-karisimbi-wardrobe",
    slug: "karisimbi-wardrobe",
    name: "Karisimbi Wardrobe",
    category: "bedroom",
    subtitle: "Natural Oak · Soft-Close Doors · Cedar Interior Option",
    description:
      "A quietly architectural wardrobe in natural oak with full-height doors, interior shelving and an optional cedar lining.",
    story:
      "Built as fitted furniture rather than a cabinet, the Karisimbi wardrobe is scribed to the room and finished on every visible face. Interior layouts are agreed during the atelier consultation.",
    price: 1240000,
    images: [
      {
        src: "/images/products/karisimbi-wardrobe.jpg",
        alt: "Natural oak wardrobe with full-height doors and interior shelving",
      },
      {
        src: "/images/rooms/bedroom.jpg",
        alt: "Bedroom setting with natural timber furniture",
      },
    ],
    materials: ["Solid Oak"],
    colors: [
      { name: "Natural Oak", hex: "#c1a276" },
      { name: "Smoked Oak", hex: "#6d5844" },
    ],
    dimensions: [
      { label: "Width (standard)", value: "240 cm" },
      { label: "Depth", value: "62 cm" },
      { label: "Height", value: "230 cm" },
    ],
    variants: [
      {
        id: "width",
        label: "Width",
        options: [
          { id: "240", label: "240 cm", helper: "Four doors", priceDelta: 0 },
          { id: "280", label: "280 cm", helper: "Five doors", priceDelta: 160000 },
        ],
      },
      {
        id: "interior",
        label: "Interior",
        options: [
          { id: "oak", label: "Oak Veneer", priceDelta: 0 },
          {
            id: "cedar",
            label: "Cedar Lining",
            helper: "Natural moth deterrent",
            priceDelta: 90000,
          },
        ],
      },
    ],
    availability: "made-to-order",
    leadTime: "5 weeks",
    badge: "Made to Measure",
    rating: 4.8,
    reviewCount: 9,
    specs: [
      { label: "Carcass", value: "Oak-veneered engineered panels" },
      { label: "Doors", value: "Solid oak with soft-close hinges" },
      { label: "Interior", value: "Adjustable shelving and hanging rails" },
      { label: "Installation", value: "Fitted and levelled on site" },
    ],
    care: careTimber,
    collection: "Karisimbi Series",
    tags: ["wardrobe", "oak", "bedroom", "storage"],
  },
  {
    id: "prod-fluted-console",
    slug: "fluted-ash-console",
    name: "Fluted Ash Console",
    category: "living-room",
    subtitle: "Chalk Finish · Fluted Doors · Solid Ash Top",
    description:
      "A slender console with hand-fluted doors and a solid ash top — an entryway piece that hides everyday clutter with quiet elegance.",
    story:
      "Each reed on the Fluted Ash Console is cut and sanded by hand before the doors are hung individually. Inside, adjustable shelving accommodates everything from table linens to records.",
    price: 640000,
    images: [
      {
        src: "/images/products/fluted-ash-console.jpg",
        alt: "Cream fluted console with solid ash top in a warm hallway",
      },
      {
        src: "/images/rooms/living-room.jpg",
        alt: "Warm minimal living room setting",
      },
    ],
    materials: ["Ash"],
    colors: [
      { name: "Chalk", hex: "#e2d8c6" },
      { name: "Natural Ash", hex: "#c2a67d" },
      { name: "Smoked Oak", hex: "#6d5844" },
    ],
    dimensions: [
      { label: "Width (standard)", value: "140 cm" },
      { label: "Depth", value: "45 cm" },
      { label: "Height", value: "78 cm" },
    ],
    variants: [
      {
        id: "width",
        label: "Width",
        options: [
          { id: "140", label: "140 cm", priceDelta: 0 },
          { id: "180", label: "180 cm", priceDelta: 90000 },
        ],
      },
      {
        id: "finish",
        label: "Finish",
        options: [
          { id: "chalk", label: "Chalk", priceDelta: 0, swatch: "#e2d8c6" },
          { id: "natural", label: "Natural Ash", priceDelta: 0, swatch: "#c2a67d" },
          {
            id: "smoked",
            label: "Smoked Oak",
            priceDelta: 35000,
            swatch: "#6d5844",
          },
        ],
      },
    ],
    availability: "in-stock",
    leadTime: "In Kigali stock · dispatch within 72 hours",
    badge: "In Stock",
    rating: 4.8,
    reviewCount: 12,
    specs: [
      { label: "Top", value: "Solid ash, 3 cm" },
      { label: "Doors", value: "Hand-fluted solid ash" },
      { label: "Shelving", value: "Two adjustable shelves" },
      { label: "Finish", value: "Water-based matte lacquer" },
    ],
    care: careTimber,
    collection: "Entryway Series",
    tags: ["console", "sideboard", "ash", "entryway"],
  },
  {
    id: "prod-nyarutarama-loveseat",
    slug: "nyarutarama-curved-loveseat",
    name: "Nyarutarama Curved Loveseat",
    category: "living-room",
    subtitle: "Ivory Bouclé · Natural Oak Base · Two-Seater",
    description:
      "A compact, deeply curved loveseat in ivory bouclé, made for reading corners and quiet conversational spaces.",
    story:
      "Smaller sibling to the Imanzi sofa, the Nyarutarama loveseat keeps the same sculptural curve in a two-seat footprint. Its oak base is cut to a continuous line and hand-sanded.",
    price: 980000,
    compareAtPrice: 1090000,
    images: [
      {
        src: "/images/products/nyarutarama-loveseat.jpg",
        alt: "Ivory bouclé curved loveseat in a sunlit gallery-like room",
      },
      {
        src: "/images/editorial/gallery-sofa.jpg",
        alt: "The curved loveseat silhouette in a quiet ivory room",
      },
    ],
    materials: ["Bouclé", "Solid Oak"],
    colors: [
      { name: "Ivory Mist", hex: "#e6ddce" },
      { name: "Warm Sand", hex: "#cbb69a" },
    ],
    dimensions: [
      { label: "Width", value: "172 cm" },
      { label: "Depth", value: "88 cm" },
      { label: "Seat height", value: "43 cm" },
    ],
    variants: [
      {
        id: "upholstery",
        label: "Upholstery",
        options: [
          { id: "ivory", label: "Ivory Mist", priceDelta: 0, swatch: "#e6ddce" },
          { id: "sand", label: "Warm Sand", priceDelta: 35000, swatch: "#cbb69a" },
        ],
      },
      {
        id: "base",
        label: "Base",
        options: [
          { id: "oak", label: "Natural Oak", priceDelta: 0, swatch: "#b08a5c" },
          { id: "smoked", label: "Smoked Oak", priceDelta: 55000, swatch: "#5a4233" },
        ],
      },
    ],
    availability: "made-to-order",
    leadTime: "10–14 days",
    rating: 4.8,
    reviewCount: 8,
    specs: [
      { label: "Frame", value: "Hardwood frame, corner-blocked" },
      { label: "Upholstery", value: "Ivory loop bouclé" },
      { label: "Base", value: "Solid oak plinth" },
      { label: "Seats", value: "Two" },
    ],
    care: careUpholstery,
    seating: 2,
    collection: "Imanzi Series",
    tags: ["loveseat", "sofa", "boucle", "living room"],
  },
  {
    id: "prod-nyungwe-table",
    slug: "nyungwe-travertine-coffee-table",
    name: "Nyungwe Travertine Coffee Table",
    category: "living-room",
    subtitle: "Honed Travertine · Solid Stone Plinth",
    description:
      "A low, monolithic coffee table in honed travertine, cut for rooms that favour quiet weight and natural texture.",
    story:
      "Each travertine top is selected for its veining and honed to a soft matte finish. The pedestal base is cut from the same block so tone and grain remain continuous.",
    price: 520000,
    images: [
      {
        src: "/images/products/nyungwe-travertine-table.jpg",
        alt: "Round travertine coffee table with a sculptural vase",
      },
      {
        src: "/images/hero/hero-living-room.jpg",
        alt: "Travertine table in a dusk-lit living room",
      },
    ],
    materials: ["Travertine"],
    colors: [
      { name: "Ivory Travertine", hex: "#d8c9b2" },
      { name: "Walnut Travertine", hex: "#b49a7c" },
    ],
    dimensions: [
      { label: "Diameter", value: "90 cm" },
      { label: "Height", value: "32 cm" },
      { label: "Top thickness", value: "4 cm" },
    ],
    variants: [
      {
        id: "diameter",
        label: "Diameter",
        options: [
          { id: "90", label: "90 cm", priceDelta: 0 },
          { id: "110", label: "110 cm", priceDelta: 65000 },
        ],
      },
      {
        id: "tone",
        label: "Stone Tone",
        options: [
          { id: "ivory", label: "Ivory", priceDelta: 0, swatch: "#d8c9b2" },
          { id: "walnut", label: "Walnut Tone", priceDelta: 0, swatch: "#b49a7c" },
        ],
      },
    ],
    availability: "in-stock",
    leadTime: "In Kigali stock · dispatch within 72 hours",
    rating: 4.7,
    reviewCount: 7,
    specs: [
      { label: "Material", value: "Honed travertine" },
      { label: "Base", value: "Solid stone plinth" },
      { label: "Sealing", value: "Penetrating stone sealer" },
      { label: "Weight", value: "62 kg" },
    ],
    care: [
      "Wipe with a soft, damp cloth and dry immediately.",
      "Use coasters under drinks and avoid acidic cleaners.",
      "Re-seal annually with a penetrating stone sealer.",
    ],
    tags: ["coffee table", "stone", "travertine", "living room"],
  },
  {
    id: "prod-gitaraama-vessel",
    slug: "gitaraama-sculptural-vessel",
    name: "Gitaraama Sculptural Vessel",
    category: "living-room",
    subtitle: "Hand-Thrown Ceramic · Raw Matte Glaze",
    description:
      "A hand-thrown vessel with a raw matte glaze, made in small batches for shelves, consoles and tables.",
    story:
      "Thrown on the wheel and finished by hand, each Gitaraama vessel carries small variations in tone and form. They are made in limited batches for the showroom.",
    price: 65000,
    images: [
      {
        src: "/images/products/ceramic-vessel.jpg",
        alt: "Hand-thrown ceramic vessel with a raw matte glaze",
      },
    ],
    materials: ["Ceramic"],
    colors: [
      { name: "Raw Clay", hex: "#d9c5a8" },
      { name: "Sand Glaze", hex: "#c8b393" },
    ],
    dimensions: [
      { label: "Height", value: "28 cm" },
      { label: "Diameter", value: "22 cm" },
    ],
    variants: [
      {
        id: "height",
        label: "Height",
        options: [
          { id: "28", label: "28 cm", priceDelta: 0 },
          { id: "36", label: "36 cm", priceDelta: 25000 },
        ],
      },
    ],
    availability: "in-stock",
    leadTime: "In stock at the Kigali showroom",
    rating: 4.9,
    reviewCount: 5,
    specs: [
      { label: "Material", value: "Stoneware clay" },
      { label: "Finish", value: "Raw matte glaze" },
      { label: "Care", value: "Wipe clean; not dishwasher safe" },
    ],
    care: ["Wipe with a soft, dry cloth.", "Avoid submerging in water."],
    tags: ["vase", "ceramic", "decor", "object"],
  },
  {
    id: "prod-kiziwa-cushion",
    slug: "kiziwa-linen-cushion",
    name: "Kiziwa Linen Cushion",
    category: "living-room",
    subtitle: "Stonewashed Belgian Linen · Feather Insert",
    description:
      "A generously sized cushion in stonewashed Belgian linen, finished with a concealed zip and a feather insert.",
    story:
      "Woven from long-staple Belgian flax and softened by stone washing, the Kiziwa cushion is the quiet layer that finishes a sofa or a bed.",
    price: 48000,
    images: [
      {
        src: "/images/products/linen-cushion.jpg",
        alt: "Ivory linen cushion on a bed with a ceramic lamp",
      },
      {
        src: "/images/products/rusizi-linen-bedding.jpg",
        alt: "Linen bedding detail in warm ivory tones",
      },
    ],
    materials: ["Linen"],
    colors: [
      { name: "Ivory", hex: "#e8dfd0" },
      { name: "Warm Sand", hex: "#d4c0a3" },
    ],
    dimensions: [
      { label: "Standard", value: "50 × 50 cm" },
      { label: "Grand", value: "60 × 60 cm" },
    ],
    variants: [
      {
        id: "size",
        label: "Size",
        options: [
          { id: "50", label: "50 × 50 cm", priceDelta: 0 },
          { id: "60", label: "60 × 60 cm", priceDelta: 12000 },
        ],
      },
      {
        id: "insert",
        label: "Insert",
        options: [
          { id: "feather", label: "Feather", priceDelta: 0 },
          { id: "fibre", label: "Hypoallergenic Fibre", priceDelta: 0 },
        ],
      },
    ],
    availability: "in-stock",
    leadTime: "In stock at the Kigali showroom",
    rating: 4.8,
    reviewCount: 6,
    specs: [
      { label: "Cover", value: "100% Belgian linen, stonewashed" },
      { label: "Closure", value: "Concealed zip" },
      { label: "Care", value: "Machine wash cool, line dry" },
    ],
    care: ["Machine wash at 30°C on a gentle cycle.", "Line dry; warm iron if desired."],
    tags: ["cushion", "linen", "decor"],
  },
  {
    id: "prod-gicumbi-bedside",
    slug: "gicumbi-bedside-table",
    name: "Gicumbi Bedside Table",
    category: "bedroom",
    subtitle: "Solid Oak · Single Drawer · Open Shelf",
    description:
      "A compact bedside table in solid oak, with a soft-close drawer and an open shelf sized for a book and a carafe.",
    story:
      "Proportioned to sit beside the Virunga platform bed, the Gicumbi table is built with hand-cut dovetail joints and a discreet cable notch at the rear.",
    price: 285000,
    images: [
      {
        src: "/images/products/gicumbi-bedside-table.jpg",
        alt: "Oak bedside table with a ceramic lamp beside a low bed",
      },
      {
        src: "/images/rooms/bedroom.jpg",
        alt: "Bedside table in a warm bedroom setting",
      },
    ],
    materials: ["Solid Oak"],
    colors: [{ name: "Natural Oak", hex: "#c1a276" }],
    dimensions: [
      { label: "Width", value: "45 cm" },
      { label: "Depth", value: "40 cm" },
      { label: "Height", value: "52 cm" },
    ],
    variants: [
      {
        id: "width",
        label: "Width",
        options: [
          { id: "45", label: "45 cm", priceDelta: 0 },
          { id: "55", label: "55 cm", helper: "Grand", priceDelta: 40000 },
        ],
      },
    ],
    availability: "in-stock",
    leadTime: "In Kigali stock · dispatch within 48 hours",
    rating: 4.8,
    reviewCount: 10,
    specs: [
      { label: "Material", value: "Solid oak" },
      { label: "Drawer", value: "Soft-close, dovetailed" },
      { label: "Finish", value: "Matte hardwax oil" },
    ],
    care: careTimber,
    tags: ["bedside", "nightstand", "oak", "bedroom"],
  },
  {
    id: "prod-rusizi-bedding",
    slug: "rusizi-linen-bedding-set",
    name: "Rusizi Linen Bedding Set",
    category: "bedroom",
    subtitle: "Stonewashed Linen · Duvet Cover & Two Pillowcases",
    description:
      "A relaxed bedding set in stonewashed linen — a duvet cover and two pillowcases that soften with every wash.",
    story:
      "Cut generously so the linen drapes rather than stretches, the Rusizi set is pre-washed for immediate softness. Colours are dyed in small batches.",
    price: 340000,
    images: [
      {
        src: "/images/products/rusizi-linen-bedding.jpg",
        alt: "Ivory stonewashed linen bedding on a low platform bed",
      },
      {
        src: "/images/rooms/bedroom.jpg",
        alt: "Linen bedding styled in a calm bedroom",
      },
    ],
    materials: ["Linen"],
    colors: [
      { name: "Ivory", hex: "#e8dfd0" },
      { name: "Sand", hex: "#d4c0a3" },
      { name: "Clay", hex: "#b99a82" },
    ],
    dimensions: [
      { label: "Queen set", value: "200 × 200 cm duvet" },
      { label: "King set", value: "220 × 240 cm duvet" },
    ],
    variants: [
      {
        id: "size",
        label: "Size",
        options: [
          { id: "queen", label: "Queen", priceDelta: 0 },
          { id: "king", label: "King", priceDelta: 40000 },
        ],
      },
      {
        id: "colour",
        label: "Colour",
        options: [
          { id: "ivory", label: "Ivory", priceDelta: 0, swatch: "#e8dfd0" },
          { id: "sand", label: "Sand", priceDelta: 0, swatch: "#d4c0a3" },
          { id: "clay", label: "Clay", priceDelta: 0, swatch: "#b99a82" },
        ],
      },
    ],
    availability: "in-stock",
    leadTime: "In stock at the Kigali showroom",
    rating: 4.9,
    reviewCount: 13,
    specs: [
      { label: "Material", value: "100% stonewashed linen" },
      { label: "Includes", value: "Duvet cover and two pillowcases" },
      { label: "Care", value: "Machine wash cool, tumble dry low" },
    ],
    care: ["Wash with similar colours at 30°C.", "Avoid bleach and fabric softener."],
    tags: ["bedding", "linen", "bedroom"],
  },
  {
    id: "prod-nyanza-chair",
    slug: "nyanza-woven-dining-chair",
    name: "Nyanza Woven Dining Chair",
    category: "dining-room",
    subtitle: "Solid Teak Frame · Hand-Woven Cane Seat",
    description:
      "A lightweight dining chair with a hand-woven cane seat and a solid teak frame that ages gracefully.",
    story:
      "Built to pair with the Akagera table, the Nyanza chair is light enough to move easily and woven tightly enough to sit comfortably for hours.",
    price: 195000,
    images: [
      {
        src: "/images/products/nyanza-dining-chair.jpg",
        alt: "Teak dining chair with a hand-woven cane back and seat",
      },
      {
        src: "/images/rooms/dining-room.jpg",
        alt: "Woven dining chairs around a solid timber table",
      },
    ],
    materials: ["Solid Teak", "Rattan & Cane"],
    colors: [
      { name: "Natural Teak", hex: "#a87a4e" },
      { name: "Smoked Teak", hex: "#6b4d36" },
    ],
    dimensions: [
      { label: "Width", value: "48 cm" },
      { label: "Depth", value: "52 cm" },
      { label: "Seat height", value: "46 cm" },
    ],
    variants: [
      {
        id: "frame",
        label: "Frame Finish",
        options: [
          { id: "natural", label: "Natural Teak", priceDelta: 0, swatch: "#a87a4e" },
          { id: "smoked", label: "Smoked Teak", priceDelta: 20000, swatch: "#6b4d36" },
        ],
      },
    ],
    availability: "in-stock",
    leadTime: "In Kigali stock · dispatch within 48 hours",
    rating: 4.7,
    reviewCount: 9,
    specs: [
      { label: "Frame", value: "Solid teak" },
      { label: "Seat", value: "Hand-woven cane" },
      { label: "Stacking", value: "Not designed for stacking" },
    ],
    care: [...careTimber, "Keep cane away from prolonged damp."],
    tags: ["dining chair", "cane", "teak", "dining room"],
  },
  {
    id: "prod-kibuye-stool",
    slug: "kibuye-counter-stool",
    name: "Kibuye Counter Stool",
    category: "dining-room",
    subtitle: "Solid Teak · Sculpted Seat · Counter or Bar Height",
    description:
      "A sculpted solid teak stool, available in counter and bar heights, with a dished seat that stays comfortable without a cushion.",
    story:
      "The Kibuye stool is shaped from a single block of teak. The seat is carved to a shallow dish, then sanded and oiled by hand.",
    price: 165000,
    images: [
      {
        src: "/images/products/kibuye-counter-stool.jpg",
        alt: "Sculpted solid teak counter stool beneath a timber table",
      },
      {
        src: "/images/rooms/dining-room.jpg",
        alt: "Teak stool in a warm dining setting",
      },
    ],
    materials: ["Solid Teak"],
    colors: [{ name: "Natural Teak", hex: "#a87a4e" }],
    dimensions: [
      { label: "Counter height", value: "65 cm" },
      { label: "Bar height", value: "75 cm" },
      { label: "Seat diameter", value: "34 cm" },
    ],
    variants: [
      {
        id: "height",
        label: "Height",
        options: [
          { id: "65", label: "65 cm", helper: "Counter", priceDelta: 0 },
          { id: "75", label: "75 cm", helper: "Bar", priceDelta: 15000 },
        ],
      },
    ],
    availability: "in-stock",
    leadTime: "In stock at the Kigali showroom",
    rating: 4.8,
    reviewCount: 7,
    specs: [
      { label: "Material", value: "Solid teak" },
      { label: "Seat", value: "Hand-carved dish" },
      { label: "Finish", value: "Hardwax oil" },
    ],
    care: careTimber,
    tags: ["stool", "teak", "dining room", "kitchen"],
  },
  {
    id: "prod-rubavu-chair",
    slug: "rubavu-sculptural-task-chair",
    name: "Rubavu Sculptural Task Chair",
    category: "home-office",
    subtitle: "Solid Walnut · Slate Wool Upholstery · Swivel Base",
    description:
      "A task chair with a carved walnut frame and a gently padded seat, built for long hours of focused work.",
    story:
      "The Rubavu chair balances a supportive, gently reclined back with a compact footprint. Its frame is shaped by hand and finished to a soft matte sheen.",
    price: 420000,
    images: [
      {
        src: "/images/products/rubavu-task-chair.jpg",
        alt: "Sculptural walnut task chair at a solid timber desk",
      },
      {
        src: "/images/rooms/workspace.jpg",
        alt: "Task chair in a refined home office",
      },
    ],
    materials: ["Walnut", "Wool"],
    colors: [
      { name: "Slate Wool", hex: "#6e6a63" },
      { name: "Sand Wool", hex: "#bfae93" },
    ],
    dimensions: [
      { label: "Width", value: "58 cm" },
      { label: "Depth", value: "56 cm" },
      { label: "Seat height", value: "47 cm" },
    ],
    variants: [
      {
        id: "upholstery",
        label: "Upholstery",
        options: [
          { id: "slate", label: "Slate Wool", priceDelta: 0, swatch: "#6e6a63" },
          { id: "sand", label: "Sand Wool", priceDelta: 0, swatch: "#bfae93" },
        ],
      },
      {
        id: "base",
        label: "Base",
        options: [
          { id: "swivel", label: "Swivel", priceDelta: 0 },
          { id: "static", label: "Static", priceDelta: 0 },
        ],
      },
    ],
    availability: "made-to-order",
    leadTime: "2–3 weeks",
    rating: 4.7,
    reviewCount: 6,
    specs: [
      { label: "Frame", value: "Solid walnut" },
      { label: "Upholstery", value: "Wool blend over foam" },
      { label: "Base", value: "Concealed swivel mechanism" },
    ],
    care: careUpholstery,
    tags: ["chair", "office chair", "walnut", "home office"],
  },
  {
    id: "prod-kibagabaga-shelf",
    slug: "kibagabaga-bookshelf",
    name: "Kibagabaga Bookshelf",
    category: "home-office",
    subtitle: "Solid Walnut · Open Shelving · Wall-Fixed",
    description:
      "An open walnut bookshelf that reads as architecture — slender uprights, adjustable shelves and a hand-rubbed finish.",
    story:
      "Designed to be fitted to the wall, the Kibagabaga shelf can be built to the full height of a study. Shelves are adjustable on brass pins.",
    price: 890000,
    images: [
      {
        src: "/images/products/kibagabaga-bookshelf.jpg",
        alt: "Walnut open bookshelf with books and ceramic objects",
      },
      {
        src: "/images/rooms/workspace.jpg",
        alt: "Walnut shelving in a home study",
      },
    ],
    materials: ["Walnut"],
    colors: [
      { name: "Natural Walnut", hex: "#6c4c37" },
      { name: "Smoked Ash", hex: "#4a3a30" },
    ],
    dimensions: [
      { label: "Width", value: "180 cm" },
      { label: "Depth", value: "34 cm" },
      { label: "Height", value: "210 cm" },
    ],
    variants: [
      {
        id: "width",
        label: "Width",
        options: [
          { id: "180", label: "180 cm", priceDelta: 0 },
          { id: "240", label: "240 cm", helper: "Full wall", priceDelta: 210000 },
        ],
      },
    ],
    availability: "made-to-order",
    leadTime: "4 weeks",
    rating: 4.8,
    reviewCount: 4,
    specs: [
      { label: "Material", value: "Solid walnut uprights, veneered shelves" },
      { label: "Shelving", value: "Five adjustable shelves" },
      { label: "Installation", value: "Wall-fixed by our team" },
    ],
    care: careTimber,
    tags: ["bookshelf", "shelving", "walnut", "home office"],
  },
  {
    id: "prod-kivu-daybed",
    slug: "kivu-terrace-daybed",
    name: "Kivu Terrace Daybed",
    category: "outdoor",
    subtitle: "Solid Teak · Sand Outdoor Bouclé · Deep Cushion",
    description:
      "A generous terrace daybed in solid teak with deep, weather-ready cushions — built for long afternoons above the city.",
    story:
      "The Kivu daybed is made for covered terraces: a teak frame that greys gracefully outdoors, and quick-dry foam cushions wrapped in outdoor bouclé.",
    price: 1350000,
    images: [
      {
        src: "/images/products/kivu-terrace-daybed.jpg",
        alt: "Teak outdoor daybed with sand cushions on a shaded terrace",
      },
      {
        src: "/images/rooms/outdoor-living.jpg",
        alt: "Terrace daybed overlooking green hills",
      },
    ],
    materials: ["Solid Teak", "Outdoor Bouclé"],
    colors: [
      { name: "Natural Teak", hex: "#a87a4e" },
      { name: "Smoked Teak", hex: "#6b4d36" },
    ],
    dimensions: [
      { label: "Width", value: "200 cm" },
      { label: "Depth", value: "100 cm" },
      { label: "Seat height", value: "38 cm" },
    ],
    variants: [
      {
        id: "frame",
        label: "Frame",
        options: [
          { id: "teak", label: "Natural Teak", priceDelta: 0, swatch: "#a87a4e" },
          { id: "smoked", label: "Smoked Teak", priceDelta: 75000, swatch: "#6b4d36" },
        ],
      },
      {
        id: "cushion",
        label: "Cushion",
        options: [
          { id: "sand", label: "Sand Bouclé", priceDelta: 0, swatch: "#cbb69a" },
          { id: "ivory", label: "Ivory Outdoor Linen", priceDelta: 0, swatch: "#e6ddce" },
        ],
      },
    ],
    availability: "made-to-order",
    leadTime: "3 weeks",
    rating: 4.8,
    reviewCount: 5,
    specs: [
      { label: "Frame", value: "Solid teak, oiled" },
      { label: "Cushions", value: "Quick-dry foam, outdoor bouclé" },
      { label: "Use", value: "Covered outdoor and indoor" },
    ],
    care: [...careTimber, "Store cushions when not in use during the rainy season."],
    tags: ["daybed", "outdoor", "teak", "terrace"],
  },
  {
    id: "prod-nyabarongo-table",
    slug: "nyabarongo-outdoor-side-table",
    name: "Nyabarongo Outdoor Side Table",
    category: "outdoor",
    subtitle: "Solid Stone · Carved Base · Weather-Resistant",
    description:
      "A small carved stone table that holds a drink, a book and a candle — equally at home on a terrace or beside a bath.",
    story:
      "Cut from a single block of stone, the Nyabarongo table is left with a softly textured surface that ages with the weather.",
    price: 310000,
    images: [
      {
        src: "/images/products/nyabarongo-side-table.jpg",
        alt: "Carved stone side table with a bowl and vase on a terrace",
      },
      {
        src: "/images/rooms/outdoor-living.jpg",
        alt: "Outdoor table in a terrace lounge setting",
      },
    ],
    materials: ["Stone"],
    colors: [{ name: "Natural Stone", hex: "#b3a48c" }],
    dimensions: [
      { label: "Diameter", value: "46 cm" },
      { label: "Height", value: "42 cm" },
    ],
    variants: [
      {
        id: "height",
        label: "Height",
        options: [
          { id: "42", label: "42 cm", helper: "Side table", priceDelta: 0 },
          { id: "52", label: "52 cm", helper: "Sofa side", priceDelta: 30000 },
        ],
      },
    ],
    availability: "in-stock",
    leadTime: "In Kigali stock · dispatch within 72 hours",
    rating: 4.6,
    reviewCount: 3,
    specs: [
      { label: "Material", value: "Carved natural stone" },
      { label: "Finish", value: "Textured matt" },
      { label: "Weight", value: "28 kg" },
    ],
    care: ["Wipe clean with a damp cloth.", "Re-seal annually if used outdoors."],
    tags: ["side table", "stone", "outdoor", "terrace"],
  },
];

export const productMap = Object.fromEntries(
  products.map((product) => [product.slug, product]),
) as Record<string, Product>;

export const featuredProducts = products.filter((product) => product.featured);

export const getProductBySlug = (slug: string): Product | undefined =>
  productMap[slug];

export const getProductsByCategory = (category?: string): Product[] =>
  category && category !== "all"
    ? products.filter((product) => product.category === category)
    : products;

export const getRelatedProducts = (product: Product, limit = 4): Product[] => {
  const sameCategory = products.filter(
    (candidate) =>
      candidate.slug !== product.slug && candidate.category === product.category,
  );
  const others = products.filter(
    (candidate) =>
      candidate.slug !== product.slug && candidate.category !== product.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
};

export const getProductsBySlugs = (slugs: string[]): Product[] =>
  slugs.map((slug) => productMap[slug]).filter(Boolean);

/** Distinct material values used by the catalogue filter. */
export const materialFacets = Array.from(
  new Set(products.flatMap((product) => product.materials)),
).sort((a, b) => a.localeCompare(b));

export const priceBounds = {
  min: Math.min(...products.map((product) => product.price)),
  max: Math.max(...products.map((product) => product.price)),
};

export const searchProducts = (query: string, limit = 6): Product[] => {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return products
    .filter((product) =>
      [
        product.name,
        product.subtitle,
        product.description,
        product.category,
        ...product.materials,
        ...(product.tags ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    )
    .slice(0, limit);
};
