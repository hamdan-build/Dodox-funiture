import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { JournalList } from "@/components/home/journal-list";
import { buildMetadata } from "@/lib/seo";
import { getPublishedJournalPostsFromDb } from "@/lib/server/services/cms.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "The Journal",
  description:
    "Atelier notes, material studies and room stories from DODOX Furniture in Kigali.",
  path: "/journal",
  image: "/images/rooms/living-room.jpg",
});

export default async function JournalPage() {
  const posts = await getPublishedJournalPostsFromDb();

  return (
    <>
      <div className="container-shell pt-5">
        <Breadcrumbs items={[{ label: "Journal" }]} />
      </div>
      <JournalList initialPosts={posts} />
      <NewsletterSection />
    </>
  );
}
