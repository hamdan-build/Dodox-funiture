import { asc, desc, eq } from "drizzle-orm";
import {
  journalPosts as staticJournalPosts,
  testimonials as staticTestimonials,
} from "@/data/journal";
import { getDb } from "@/lib/server/db/client";
import { ensureSeeded } from "@/lib/server/db/seed";
import {
  banners,
  faqs,
  homepageSections,
  journalPosts,
  pages,
  testimonials,
  users,
} from "@/lib/server/db/schema";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/server/errors";
import { generateId, nowIso, slugify } from "@/lib/server/ids";
import {
  sanitizeMultilineText,
  sanitizeText,
} from "@/lib/server/security/sanitize";
import { recordActivityLog } from "@/lib/server/services/audit.service";
import type { JournalPost, Testimonial } from "@/types";

function mapJournalRow(row: typeof journalPosts.$inferSelect): JournalPost {
  let body: JournalPost["body"] = [];
  try {
    const parsed = JSON.parse(row.bodyJson);
    if (Array.isArray(parsed)) {
      body = parsed;
    }
  } catch {
    body = [];
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    readTime: row.readTime,
    date: row.publishedDate,
    image: row.imageUrl,
    alt: row.imageAlt,
    featured: row.featured,
    isSample: row.isSample,
    body,
  };
}

export async function getPublishedJournalPostsFromDb(): Promise<JournalPost[]> {
  try {
    const db = await getDb();
    await ensureSeeded(db);
    const rows = await db
      .select()
      .from(journalPosts)
      .where(eq(journalPosts.status, "published"))
      .orderBy(desc(journalPosts.featured), desc(journalPosts.publishedDate));
    if (!rows.length) return staticJournalPosts;
    return rows.map(mapJournalRow);
  } catch {
    return staticJournalPosts;
  }
}

export async function getPublishedJournalPostBySlugFromDb(slug: string): Promise<{
  post: JournalPost | null;
  related: JournalPost[];
}> {
  const all = await getPublishedJournalPostsFromDb();
  const post = all.find((p) => p.slug === slug) ?? null;
  const related = all.filter((p) => p.slug !== slug).slice(0, 3);
  return { post, related };
}

export async function getPublishedTestimonialsFromDb(): Promise<Testimonial[]> {
  try {
    const db = await getDb();
    await ensureSeeded(db);
    const rows = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isPublished, true))
      .orderBy(asc(testimonials.sortOrder));
    if (!rows.length) return staticTestimonials;
    return rows.map((r) => ({
      id: r.id,
      quote: r.quote,
      author: r.author,
      initials: r.initials,
      location: r.location,
      piece: r.pieceName,
    }));
  } catch {
    return staticTestimonials;
  }
}

export async function listAdminCmsBundle() {
  const db = await getDb();
  await ensureSeeded(db);

  const [posts, reviewList, sections, bannerList, faqList, pageList] =
    await Promise.all([
      db.select().from(journalPosts).orderBy(desc(journalPosts.publishedDate)),
      db.select().from(testimonials).orderBy(asc(testimonials.sortOrder)),
      db
        .select()
        .from(homepageSections)
        .orderBy(asc(homepageSections.sortOrder)),
      db.select().from(banners).orderBy(asc(banners.sortOrder)),
      db.select().from(faqs).orderBy(asc(faqs.sortOrder)),
      db.select().from(pages).orderBy(asc(pages.title)),
    ]);

  return {
    journalPosts: posts.map((p) => ({
      ...p,
      body: (() => {
        try {
          return JSON.parse(p.bodyJson) as JournalPost["body"];
        } catch {
          return [];
        }
      })(),
    })),
    testimonials: reviewList,
    homepageSections: sections,
    banners: bannerList,
    faqs: faqList,
    pages: pageList,
  };
}

export async function upsertJournalPost(params: {
  id?: string;
  slug?: string;
  title: string;
  excerpt: string;
  category: string;
  readTime?: string;
  publishedDate?: string;
  imageUrl: string;
  imageAlt?: string;
  featured?: boolean;
  bodyText?: string;
  body?: JournalPost["body"];
  status?: "draft" | "published";
  isSample?: boolean;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  const db = await getDb();
  const title = sanitizeText(params.title, 200);
  if (title.length < 3) {
    throw new ValidationError("Journal article title is required.");
  }

  const slug = slugify(params.slug?.trim() || title);
  const excerpt = sanitizeMultilineText(params.excerpt, 600);
  const category = sanitizeText(params.category || "Atelier Notes", 80);
  const readTime = sanitizeText(params.readTime || "5 min read", 40);
  const publishedDate =
    params.publishedDate?.trim() || new Date().toISOString().slice(0, 10);
  const imageUrl = sanitizeText(params.imageUrl, 400);
  const imageAlt = sanitizeText(params.imageAlt || title, 200);

  let blocks: JournalPost["body"] = params.body ?? [];
  if (!blocks.length && params.bodyText) {
    blocks = params.bodyText
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        if (chunk.startsWith("## ")) {
          return { type: "heading" as const, text: sanitizeText(chunk.slice(3), 240) };
        }
        if (chunk.startsWith("> ")) {
          return {
            type: "quote" as const,
            text: sanitizeMultilineText(chunk.slice(2), 1000),
          };
        }
        return {
          type: "paragraph" as const,
          text: sanitizeMultilineText(chunk, 2000),
        };
      });
  }

  let validActorId: string | null = null;
  if (params.actorUserId) {
    const u = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, params.actorUserId))
      .limit(1);
    validActorId = u[0]?.id ?? null;
  }

  const now = nowIso();
  if (params.id) {
    const existing = await db
      .select()
      .from(journalPosts)
      .where(eq(journalPosts.id, params.id))
      .limit(1);
    if (!existing[0]) {
      throw new NotFoundError("Journal post not found.");
    }

    await db
      .update(journalPosts)
      .set({
        slug,
        title,
        excerpt,
        category,
        readTime,
        publishedDate,
        imageUrl,
        imageAlt,
        featured: params.featured ?? existing[0].featured,
        bodyJson: JSON.stringify(blocks.length ? blocks : JSON.parse(existing[0].bodyJson)),
        status: params.status ?? existing[0].status,
        isSample: params.isSample ?? false,
        updatedAt: now,
      })
      .where(eq(journalPosts.id, params.id));

    await recordActivityLog({
      actorUserId: validActorId,
      actorEmail: params.actorEmail ?? null,
      action: "cms.journal.update",
      resourceType: "journal_post",
      resourceId: params.id,
      summary: `Updated journal post "${title}"`,
    });

    return { id: params.id, slug };
  }

  const conflict = await db
    .select({ id: journalPosts.id })
    .from(journalPosts)
    .where(eq(journalPosts.slug, slug))
    .limit(1);
  if (conflict[0]) {
    throw new ConflictError(`A journal post with slug "${slug}" already exists.`);
  }

  const id = generateId("jrn");
  await db.insert(journalPosts).values({
    id,
    slug,
    title,
    excerpt,
    category,
    readTime,
    publishedDate,
    imageUrl,
    imageAlt,
    featured: params.featured ?? false,
    bodyJson: JSON.stringify(blocks),
    status: params.status ?? "published",
    isSample: params.isSample ?? false,
    authorUserId: validActorId,
    createdAt: now,
    updatedAt: now,
  });

  await recordActivityLog({
    actorUserId: validActorId,
    actorEmail: params.actorEmail ?? null,
    action: "cms.journal.create",
    resourceType: "journal_post",
    resourceId: id,
    summary: `Published journal post "${title}"`,
  });

  return { id, slug };
}

export async function deleteJournalPost(id: string) {
  const db = await getDb();
  await db.delete(journalPosts).where(eq(journalPosts.id, id));
  return { deleted: true };
}

export async function upsertTestimonial(params: {
  id?: string;
  quote: string;
  author: string;
  location: string;
  pieceName: string;
  rating?: number;
  isPublished?: boolean;
  sortOrder?: number;
}) {
  const db = await getDb();
  const quote = sanitizeMultilineText(params.quote, 1000);
  const author = sanitizeText(params.author, 100);
  const location = sanitizeText(params.location, 100);
  const pieceName = sanitizeText(params.pieceName, 140);
  const initials = author
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const now = nowIso();

  if (params.id) {
    await db
      .update(testimonials)
      .set({
        quote,
        author,
        initials: initials || "DX",
        location,
        pieceName,
        rating: Math.min(5, Math.max(1, Math.round(params.rating ?? 5))),
        isPublished: params.isPublished ?? true,
        isSample: false,
        sortOrder: params.sortOrder ?? 0,
        updatedAt: now,
      })
      .where(eq(testimonials.id, params.id));
    return { id: params.id };
  }

  const id = generateId("tst");
  await db.insert(testimonials).values({
    id,
    quote,
    author,
    initials: initials || "DX",
    location,
    pieceName,
    rating: Math.min(5, Math.max(1, Math.round(params.rating ?? 5))),
    isSample: false,
    isPublished: params.isPublished ?? true,
    sortOrder: params.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  });
  return { id };
}

export async function deleteTestimonial(id: string) {
  const db = await getDb();
  await db.delete(testimonials).where(eq(testimonials.id, id));
  return { deleted: true };
}

export async function upsertFaq(params: {
  id?: string;
  category?: string;
  question: string;
  answer: string;
  sortOrder?: number;
  isPublished?: boolean;
}) {
  const db = await getDb();
  const question = sanitizeText(params.question, 300);
  const answer = sanitizeMultilineText(params.answer, 2000);
  const category = sanitizeText(params.category || "general", 60);
  const now = nowIso();

  if (params.id) {
    await db
      .update(faqs)
      .set({
        category,
        question,
        answer,
        sortOrder: params.sortOrder ?? 0,
        isPublished: params.isPublished ?? true,
        updatedAt: now,
      })
      .where(eq(faqs.id, params.id));
    return { id: params.id };
  }

  const id = generateId("faq");
  await db.insert(faqs).values({
    id,
    category,
    question,
    answer,
    sortOrder: params.sortOrder ?? 0,
    isPublished: params.isPublished ?? true,
    createdAt: now,
    updatedAt: now,
  });
  return { id };
}

export async function deleteFaq(id: string) {
  const db = await getDb();
  await db.delete(faqs).where(eq(faqs.id, id));
  return { deleted: true };
}

export async function upsertBanner(params: {
  id?: string;
  placement?: string;
  title: string;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  isActive?: boolean;
}) {
  const db = await getDb();
  const title = sanitizeText(params.title, 200);
  const now = nowIso();

  if (params.id) {
    await db
      .update(banners)
      .set({
        placement: sanitizeText(params.placement || "announcement_bar", 60),
        title,
        subtitle: params.subtitle ? sanitizeText(params.subtitle, 240) : null,
        ctaLabel: params.ctaLabel ? sanitizeText(params.ctaLabel, 60) : null,
        ctaHref: params.ctaHref ? sanitizeText(params.ctaHref, 240) : null,
        isActive: params.isActive ?? true,
        updatedAt: now,
      })
      .where(eq(banners.id, params.id));
    return { id: params.id };
  }

  const id = generateId("bnr");
  await db.insert(banners).values({
    id,
    slug: `${slugify(title)}-${id.slice(-4)}`,
    placement: sanitizeText(params.placement || "announcement_bar", 60),
    title,
    subtitle: params.subtitle ? sanitizeText(params.subtitle, 240) : null,
    ctaLabel: params.ctaLabel ? sanitizeText(params.ctaLabel, 60) : null,
    ctaHref: params.ctaHref ? sanitizeText(params.ctaHref, 240) : null,
    isActive: params.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  });
  return { id };
}
