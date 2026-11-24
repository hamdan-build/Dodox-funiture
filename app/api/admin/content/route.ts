import { z } from "zod";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/server/http";
import {
  deleteFaq,
  deleteJournalPost,
  deleteTestimonial,
  listAdminCmsBundle,
  upsertBanner,
  upsertFaq,
  upsertJournalPost,
  upsertTestimonial,
} from "@/lib/server/services/cms.service";

const postSchema = z.discriminatedUnion("entity", [
  z.object({
    entity: z.literal("journal"),
    id: z.string().optional(),
    slug: z.string().optional(),
    title: z.string().min(3).max(200),
    excerpt: z.string().min(10).max(600),
    category: z.string().min(2).max(80),
    readTime: z.string().max(40).optional(),
    publishedDate: z.string().max(30).optional(),
    imageUrl: z.string().min(1).max(400),
    imageAlt: z.string().max(200).optional(),
    featured: z.boolean().optional(),
    bodyText: z.string().max(25000).optional(),
    status: z.enum(["draft", "published"]).optional(),
    isSample: z.boolean().optional(),
  }),
  z.object({
    entity: z.literal("testimonial"),
    id: z.string().optional(),
    quote: z.string().min(10).max(1000),
    author: z.string().min(2).max(100),
    location: z.string().min(2).max(100),
    pieceName: z.string().min(2).max(140),
    rating: z.number().int().min(1).max(5).optional(),
    isPublished: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
  z.object({
    entity: z.literal("faq"),
    id: z.string().optional(),
    category: z.string().max(60).optional(),
    question: z.string().min(5).max(300),
    answer: z.string().min(5).max(2000),
    isPublished: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
  z.object({
    entity: z.literal("banner"),
    id: z.string().optional(),
    placement: z.string().max(60).optional(),
    title: z.string().min(2).max(200),
    subtitle: z.string().max(240).optional().nullable(),
    ctaLabel: z.string().max(60).optional().nullable(),
    ctaHref: z.string().max(240).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
]);

export async function GET(request: Request) {
  try {
    await requirePermission("content.manage", request);
    const data = await listAdminCmsBundle();
    return jsonOk(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission("content.manage", request);
    const body = await parseJsonBody(request, postSchema);

    if (body.entity === "journal") {
      return jsonOk(
        await upsertJournalPost({
          ...body,
          actorUserId: admin.id,
          actorEmail: admin.email,
        }),
      );
    }
    if (body.entity === "testimonial") {
      return jsonOk(await upsertTestimonial(body));
    }
    if (body.entity === "faq") {
      return jsonOk(await upsertFaq(body));
    }
    return jsonOk(await upsertBanner(body));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requirePermission("content.manage", request);
    const url = new URL(request.url);
    const entity = url.searchParams.get("entity");
    const id = url.searchParams.get("id");
    if (!id) return jsonOk({ deleted: false });

    if (entity === "journal") return jsonOk(await deleteJournalPost(id));
    if (entity === "testimonial") return jsonOk(await deleteTestimonial(id));
    if (entity === "faq") return jsonOk(await deleteFaq(id));
    return jsonOk({ deleted: false });
  } catch (error) {
    return handleApiError(error);
  }
}
