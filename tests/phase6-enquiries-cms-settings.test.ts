import { beforeEach, describe, expect, it } from "vitest";
import { installTestCloudflareEnv } from "./helpers/sqlite-d1";
import {
  exportNewsletterCsv,
  listAdminAtelierEnquiries,
  listAdminContactMessages,
  listAdminNewsletterSubscribers,
  submitAtelierEnquiry,
  submitContactMessage,
  subscribeNewsletter,
  unsubscribeNewsletterByToken,
  updateAdminAtelierEnquiry,
} from "@/lib/server/services/enquiry.service";
import {
  getPublishedJournalPostBySlugFromDb,
  getPublishedTestimonialsFromDb,
  upsertJournalPost,
  upsertTestimonial,
} from "@/lib/server/services/cms.service";
import {
  listAdminSiteSettings,
  updateAdminSiteSettings,
} from "@/lib/server/services/settings.service";
import { calculateAuthoritativeOrderQuote } from "@/lib/server/services/pricing.service";

describe("Phase 6 — Atelier Commissions, Contact, Newsletter, CMS & Site Settings", () => {
  beforeEach(() => {
    installTestCloudflareEnv();
  });

  it("persists Atelier commissions, contact messages, and newsletter consent + unsubscribe token", async () => {
    const atl = await submitAtelierEnquiry({
      name: "Claire Uwase",
      email: "claire@kigali.rw",
      phone: "+250 788 123 456",
      furnitureType: "Dining table",
      dimensions: "280cm x 110cm for 10 guests",
      materials: "Solid oak",
      finish: "Natural oil (matte)",
      budget: "3,000,000 – 6,000,000 RWF",
      description:
        "Commissioning a sculptural ten-seater dining table for a residence in Nyarutarama with rounded corners.",
      contactPreference: "whatsapp",
      referenceImages: ["/api/media/atelier-references/2026-11/sample.jpg"],
    });
    expect(atl.reference).toMatch(/^ATL-\d{4}-\d{6}$/);

    await updateAdminAtelierEnquiry({
      id: atl.id,
      status: "quotation_prepared",
      quotedAmount: 3850000,
      internalNotes: "Selected 52mm quarter-sawn oak slabs.",
    });

    const listAtl = await listAdminAtelierEnquiries({
      status: "quotation_prepared",
    });
    expect(listAtl.length).toBe(1);
    expect(listAtl[0].quotedAmount).toBe(3850000);
    expect(listAtl[0].referenceImages[0]).toContain("atelier-references");

    const msg = await submitContactMessage({
      name: "Eric Habimana",
      email: "eric@design.rw",
      subject: "Trade & interior design",
      message: "Booking a private showroom morning for three hospitality suites.",
    });
    expect(msg.reference).toMatch(/^MSG-\d{4}-\d{6}$/);
    const inbox = await listAdminContactMessages({});
    expect(inbox.some((m) => m.id === msg.id)).toBe(true);

    await subscribeNewsletter({
      email: "Collector@Kigali.rw",
      source: "footer",
    });
    const subs = await listAdminNewsletterSubscribers({ status: "active" });
    expect(subs.length).toBe(1);
    expect(subs[0].email).toBe("collector@kigali.rw");

    await unsubscribeNewsletterByToken(subs[0].unsubscribeToken);
    const unsubList = await listAdminNewsletterSubscribers({
      status: "unsubscribed",
    });
    expect(unsubList.length).toBe(1);

    const csv = await exportNewsletterCsv();
    expect(csv).toContain("collector@kigali.rw");
    expect(csv).toContain("unsubscribed");
  });

  it("publishes Journal entries & Testimonials to D1 and applies updated Website Settings to live RWF quotes", async () => {
    const post = await upsertJournalPost({
      title: "Seasoning Highland Timber in Kigali",
      excerpt: "How humidity equilibrium shapes every mortise and tenon joint.",
      category: "Material Studies",
      imageUrl: "/images/rooms/dining-room.jpg",
      bodyText:
        "## Equilibrium Moisture\n\nEvery board rests in our Gikondo workshop.\n\n> Timber remembers the forest and the room.",
      featured: true,
      status: "published",
    });

    const { post: fetched } = await getPublishedJournalPostBySlugFromDb(
      post.slug,
    );
    expect(fetched?.title).toBe("Seasoning Highland Timber in Kigali");
    expect(fetched?.body.some((b) => b.type === "heading")).toBe(true);
    expect(fetched?.body.some((b) => b.type === "quote")).toBe(true);

    await upsertTestimonial({
      quote: "The joinery on our dining table feels generational.",
      author: "Sandrine K.",
      location: "Kiyovu, Kigali",
      pieceName: "Akagera Dining Table",
    });
    const stories = await getPublishedTestimonialsFromDb();
    expect(stories.some((s) => s.author === "Sandrine K.")).toBe(true);

    await updateAdminSiteSettings({
      updates: [
        {
          key: "care_protection_price",
          value: 85000,
          groupName: "commerce",
          label: "Care Protection Fee (RWF)",
        },
      ],
    });

    const allSettings = await listAdminSiteSettings();
    expect(
      allSettings.find((s) => s.key === "care_protection_price")?.value,
    ).toBe(85000);

    const quote = await calculateAuthoritativeOrderQuote({
      lines: [
        {
          slug: "imanzi-sculptural-boucle-sofa",
          quantity: 1,
          selections: [],
        },
      ],
      careProtection: true,
    });
    expect(quote.careProtectionFee).toBe(85000);
  });
});
