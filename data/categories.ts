import type { Category } from "@/types";

export const categories: Category[] = [
  {
    slug: "living-room",
    name: "Living Room",
    shortName: "Living",
    tagline: "Living & Lounge",
    description:
      "Sculptural seating, hand-finished tables and quiet objects for the rooms where you gather.",
    image: "/images/rooms/living-room.jpg",
    alt: "Cream bouclé sofa and oak coffee table in a sunlit living room",
  },
  {
    slug: "bedroom",
    name: "Bedroom Sanctuary",
    shortName: "Bedroom",
    tagline: "Bedroom",
    description:
      "Low platform beds, solid timber wardrobes and European linens composed for rest.",
    image: "/images/rooms/bedroom.jpg",
    alt: "Low oak bed with ivory linen bedding in a softly lit bedroom",
  },
  {
    slug: "dining-room",
    name: "Dining Room",
    shortName: "Dining",
    tagline: "Dining & Entertaining",
    description:
      "Architectural dining tables and woven chairs made for long, unhurried meals.",
    image: "/images/rooms/dining-room.jpg",
    alt: "Solid oak dining table with woven cane chairs by a garden window",
  },
  {
    slug: "home-office",
    name: "Home Office",
    shortName: "Office",
    tagline: "Executive Workspace",
    description:
      "Walnut desks, supportive task chairs and open shelving for considered work.",
    image: "/images/rooms/workspace.jpg",
    alt: "Walnut executive desk with sculptural chair and oak shelving",
  },
  {
    slug: "outdoor",
    name: "Outdoor Living",
    shortName: "Outdoor",
    tagline: "Veranda & Terrace",
    description:
      "Teak, cane and weather-ready upholstery for terraces above the city.",
    image: "/images/rooms/outdoor-living.jpg",
    alt: "Covered terrace lounge with rattan seating overlooking green hills",
  },
];

export const categoryMap = Object.fromEntries(
  categories.map((category) => [category.slug, category]),
) as Record<Category["slug"], Category>;

export const curatedSpaces = [
  ...categories.map((category) => ({
    slug: category.slug,
    eyebrow: category.tagline,
    title: category.name,
    blurb: category.description,
    image: category.image,
    alt: category.alt,
    href: `/shop?category=${category.slug}`,
  })),
];
