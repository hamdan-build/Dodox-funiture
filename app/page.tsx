import type { Metadata } from "next";
import { AtelierPromo } from "@/components/home/atelier-promo";
import { Craftsmanship } from "@/components/home/craftsmanship";
import { CuratedSpaces } from "@/components/home/curated-spaces";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { JournalPreview } from "@/components/home/journal-preview";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { Standard } from "@/components/home/standard";
import { Testimonials } from "@/components/home/testimonials";
import { siteConfig } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "DODOX Furniture — Handcrafted furniture for Kigali homes",
  description: siteConfig.description,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <CuratedSpaces />
      <FeaturedProducts />
      <AtelierPromo />
      <Craftsmanship />
      <Standard />
      <Testimonials />
      <JournalPreview />
      <NewsletterSection />
    </>
  );
}
