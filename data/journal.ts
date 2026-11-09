import type { JournalPost, Testimonial } from "@/types";

/**
 * DEMO EDITORIAL CONTENT
 * Articles below are written as sample editorial for this frontend build.
 * They must be replaced with approved brand copy before publishing.
 */

export const journalPosts: JournalPost[] = [
  {
    slug: "the-quiet-geometry-of-a-living-room",
    title: "The Quiet Geometry of a Living Room",
    excerpt:
      "How proportion, negative space and a single curve can change the way a room feels before a single cushion is placed.",
    category: "Room Stories",
    readTime: "6 min read",
    date: "2026-10-14",
    image: "/images/rooms/living-room.jpg",
    alt: "Warm living room with a curved cream sofa and oak table",
    featured: true,
    body: [
      {
        type: "paragraph",
        text: "A living room rarely fails because of a missing object. More often, it fails because the objects in it are competing. The rooms that feel calm tend to share a discipline: one strong silhouette, a low horizon of furniture, and enough emptiness around both to let the eye rest.",
      },
      {
        type: "heading",
        text: "Start with the floor plan, not the sofa",
      },
      {
        type: "paragraph",
        text: "Before choosing a seat, mark the walking paths through the room. In Kigali homes, doors and windows are often kept open to the garden, which means circulation matters more than the nominal square metres. Once the paths are clear, the sofa can be placed to define a conversation zone rather than to fill a wall.",
      },
      {
        type: "quote",
        text: "A good room is not furnished. It is composed — and composition is mostly a matter of knowing what to leave out.",
      },
      {
        type: "paragraph",
        text: "A curved seat softens the geometry of a rectangular room and draws people inward. Paired with a low, round table, it removes hard corners from the centre of the plan and makes the room feel larger than its dimensions suggest. The oak plinth beneath the Imanzi sofa was designed for precisely this effect: a continuous base reads as a single line, so the eye does not stop at legs.",
      },
      {
        type: "heading",
        text: "Layer light before textiles",
      },
      {
        type: "paragraph",
        text: "Warm wall finishes and a single low lamp will do more for a room at dusk than several layers of pattern. Begin with the light you actually use in the evening, then add texture — bouclé, linen, cane — where the light falls. The result is a room that changes gradually through the day instead of revealing everything at once.",
      },
    ],
  },
  {
    slug: "reading-the-grain-timber-notes",
    title: "Reading the Grain: Notes on East African Timber",
    excerpt:
      "A short field guide to the timbers we work with — how each one behaves, ages and responds to the light in a Rwandan home.",
    category: "Material Studies",
    readTime: "8 min read",
    date: "2026-09-02",
    image: "/images/atelier/drafting.jpg",
    alt: "Furniture drawings and timber samples on an atelier workbench",
    body: [
      {
        type: "paragraph",
        text: "Timber is never a neutral material. Every species brings a temperament: how it moves with the seasons, how it takes an oil, how quickly it deepens in tone. Working locally means learning those temperaments intimately.",
      },
      {
        type: "heading",
        text: "Oak: steady and pale",
      },
      {
        type: "paragraph",
        text: "Oak is the most forgiving timber in the workshop. Its grain is quiet, its colour pale enough to sit beside linen without competing, and it accepts a matte oil evenly. Over two or three years in a bright room it warms toward honey — a change we consider part of the piece rather than a flaw.",
      },
      {
        type: "heading",
        text: "Walnut: depth and shadow",
      },
      {
        type: "paragraph",
        text: "Walnut carries more colour and more movement. It is best used where the light is controlled, and best finished with a hand-rubbed oil that leaves the pores open. A walnut desk should feel like it has weight before you touch it.",
      },
      {
        type: "heading",
        text: "Teak and cane: made for the veranda",
      },
      {
        type: "paragraph",
        text: "For covered outdoor rooms, teak and woven cane remain the most honest pairing. Teak weathers to a silver-grey if left untreated; cane tightens and relaxes with humidity. Both ask for little more than shelter from driving rain and an annual oil.",
      },
      {
        type: "paragraph",
        text: "We keep a swatch library at the showroom. Clients are welcome to take samples home and live with them for a few days before approving a finish — we consider that part of the design process, not an afterthought.",
      },
    ],
  },
  {
    slug: "dining-rooms-built-for-long-meals",
    title: "Dining Rooms Built for Long Meals",
    excerpt:
      "Why the best dining tables are slightly too generous, and how to choose seating that lets a table stay in use for hours.",
    category: "Room Stories",
    readTime: "5 min read",
    date: "2026-07-21",
    image: "/images/rooms/dining-room.jpg",
    alt: "Solid timber dining table with woven chairs and garden light",
    body: [
      {
        type: "paragraph",
        text: "A dining table is one of the few pieces of furniture we ask to host an event. It should allow for elbows, serving dishes, a centrepiece and the occasional extra guest. When in doubt, a table 20 centimetres longer than the plan requires will be the one that gets used most.",
      },
      {
        type: "heading",
        text: "Choose chairs you can sit in for three hours",
      },
      {
        type: "paragraph",
        text: "Depth matters more than padding. A woven cane seat with a slight dish will remain comfortable long after a thick cushion has compressed. Cane also breathes, which matters in a warm room.",
      },
      {
        type: "paragraph",
        text: "Leave at least 90 centimetres between the table edge and the nearest wall so a chair can be pushed back without negotiating. If the room is tight, consider a bench along one side — it seats more people and disappears under the table when not in use.",
      },
    ],
  },
  {
    slug: "the-care-of-things",
    title: "The Care of Things",
    excerpt:
      "A practical, unhurried guide to keeping timber, cane and linen at their best through Kigali's dry and rainy seasons.",
    category: "Care & Longevity",
    readTime: "7 min read",
    date: "2026-06-08",
    image: "/images/journal/workspace-study.jpg",
    alt: "Warm home study with timber desk and shelving",
    body: [
      {
        type: "paragraph",
        text: "Furniture ages best when it is used. The goal of care is not to keep a piece looking new, but to keep it sound — joints tight, finishes intact, upholstery clean enough to invite people to sit down.",
      },
      {
        type: "heading",
        text: "Once a week",
      },
      {
        type: "paragraph",
        text: "Dust timber with a dry, soft cloth, following the grain. Vacuum upholstery with a brush attachment and plump cushions. Wipe stone with a damp cloth and dry it immediately.",
      },
      {
        type: "heading",
        text: "Once a season",
      },
      {
        type: "paragraph",
        text: "Check door hinges and drawer runners; a quarter turn of a screwdriver is usually all that is required. During the dry season, oil outdoor teak lightly. During heavy rains, bring cushions inside and keep covered terraces ventilated.",
      },
      {
        type: "heading",
        text: "Once a year",
      },
      {
        type: "paragraph",
        text: "Consider a maintenance visit. Our team can inspect joinery, refresh oiled surfaces and re-tension cane in the home. It is a small ritual that adds years to a piece — and a good excuse to have the atelier visit.",
      },
    ],
  },
];

export const journalMap = Object.fromEntries(
  journalPosts.map((post) => [post.slug, post]),
) as Record<string, JournalPost>;

export const journalCategories = [
  "All",
  "Room Stories",
  "Material Studies",
  "Atelier Notes",
  "Care & Longevity",
] as const;

export const getRelatedPosts = (slug: string, limit = 3): JournalPost[] =>
  journalPosts.filter((post) => post.slug !== slug).slice(0, limit);

/**
 * SAMPLE TESTIMONIALS
 * These quotes are illustrative content for design review, not verified
 * customer statements. Replace with approved, attributed reviews before launch.
 */
export const testimonials: Testimonial[] = [
  {
    id: "t1",
    quote:
      "The sofa has completely changed the way we use our living room. The curve is generous without feeling large, and the bouclé has worn beautifully with two children in the house.",
    author: "Aline M.",
    initials: "AM",
    location: "Nyarutarama, Kigali",
    piece: "Imanzi Sculptural Bouclé Sofa",
  },
  {
    id: "t2",
    quote:
      "Ordering a bespoke dining table felt daunting, but the atelier measured the room twice and sent timber samples home with us. The finished table fits the space exactly.",
    author: "Eric K.",
    initials: "EK",
    location: "Kacyiru, Kigali",
    piece: "Akagera Six-Seater Dining Suite",
  },
  {
    id: "t3",
    quote:
      "The white-glove delivery was as considered as the furniture. Everything was placed, assembled and the packaging left with the team. It felt effortless.",
    author: "Diane U.",
    initials: "DU",
    location: "Kibagabaga, Kigali",
    piece: "Virunga King Platform Bed",
  },
];
