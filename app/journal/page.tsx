import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { JournalList } from "@/components/home/journal-list";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "The Journal",
  description:
    "Atelier notes, material studies and room stories from DODOX Furniture in Kigali. Sample editorial content for this demonstration storefront.",
  path: "/journal",
  image: "/images/rooms/living-room.jpg",
});

export default function JournalPage() {
  return (
    <>
      <div className="container-shell pt-5">
        <Breadcrumbs items={[{ label: "Journal" }]} />
      </div>
      <JournalList />
      <NewsletterSection />
    </>
  );
}
