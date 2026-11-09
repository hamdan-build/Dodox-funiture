import type { ProductReview } from "@/types";

/**
 * SAMPLE REVIEW CONTENT — NOT VERIFIED CUSTOMER FEEDBACK.
 * Included only to demonstrate the review interface. Replace with moderated,
 * verified reviews (and a real rating aggregate) before launch.
 */

export const sampleReviews: Record<string, ProductReview[]> = {
  "imanzi-sculptural-boucle-sofa": [
    {
      id: "r1",
      author: "Aline M.",
      location: "Nyarutarama",
      rating: 5,
      date: "2 weeks ago",
      title: "A transformative presence in the room",
      body:
        "The curve embraces the natural light and the view. The sand bouclé has a reassuring weight and texture that feels luxurious without being stiff. Delivery was careful and unhurried.",
      verified: true,
      tag: "Kigali delivery",
    },
    {
      id: "r2",
      author: "Eric K.",
      location: "Kacyiru",
      rating: 5,
      date: "1 month ago",
      title: "Impeccable joinery on the oak plinth",
      body:
        "I was unsure about ordering a sofa without sitting on it, but the showroom visit settled it. The ergonomics support long evenings of conversation, and the plinth detail is beautifully resolved.",
      verified: true,
      tag: "Showroom visit",
    },
    {
      id: "r3",
      author: "Diane U.",
      location: "Kibagabaga",
      rating: 4,
      date: "2 months ago",
      title: "Beautifully made, generous in scale",
      body:
        "The sofa is larger in person than I expected — measure your room carefully. The upholstery has worn beautifully so far, and the team arranged a swatch visit before delivery.",
      verified: true,
      tag: "Swatch visit",
    },
  ],
  "kigali-oak-coffee-table": [
    {
      id: "r4",
      author: "Patrick N.",
      location: "Gacuriro",
      rating: 5,
      date: "3 weeks ago",
      title: "The fluted base is the detail",
      body:
        "Solid, beautifully finished and the perfect height next to a low sofa. The oak has a lovely matte feel rather than a lacquered sheen.",
      verified: true,
      tag: "Kigali delivery",
    },
    {
      id: "r5",
      author: "Sandrine B.",
      location: "Kimihurura",
      rating: 5,
      date: "2 months ago",
      title: "Simple and beautifully proportioned",
      body:
        "It anchors the seating area without dominating it. Delivery was prompt and the table arrived perfectly wrapped.",
      verified: true,
      tag: "In-stock order",
    },
  ],
  "virunga-king-platform-bed": [
    {
      id: "r6",
      author: "Claudine R.",
      location: "Nyarutarama",
      rating: 5,
      date: "1 month ago",
      title: "The room finally feels calm",
      body:
        "The low platform makes the ceiling feel higher. Assembly was quick and the team levelled everything perfectly on an uneven floor.",
      verified: true,
      tag: "White-glove assembly",
    },
    {
      id: "r7",
      author: "Jean-Paul M.",
      location: "Kibagabaga",
      rating: 5,
      date: "3 months ago",
      title: "Worth the wait",
      body:
        "Made to order took just over three weeks. The headboard linen is generous and the frame feels exceptionally solid.",
      verified: true,
      tag: "Made to order",
    },
  ],
  "akagera-six-seater-dining-suite": [
    {
      id: "r8",
      author: "Marie-Claire V.",
      location: "Kacyiru",
      rating: 5,
      date: "5 weeks ago",
      title: "Built for long lunches",
      body:
        "We ordered the 260 cm table with eight chairs. The cane seats are comfortable for hours and the teak has a beautiful, quiet grain.",
      verified: true,
      tag: "Bespoke dimensions",
    },
  ],
};

export const getReviewsForProduct = (slug: string): ProductReview[] =>
  sampleReviews[slug] ?? [];

export const reviewHistogram = (reviews: ProductReview[]) => {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => review.rating === star).length,
  }));
  const total = reviews.length;
  return counts.map((row) => ({
    ...row,
    percentage: total ? Math.round((row.count / total) * 100) : 0,
  }));
};
