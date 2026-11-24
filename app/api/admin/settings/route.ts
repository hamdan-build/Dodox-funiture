import { z } from "zod";
import { requirePermission } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/server/http";
import {
  listAdminSiteSettings,
  updateAdminSiteSettings,
} from "@/lib/server/services/settings.service";

const updateSchema = z.object({
  updates: z
    .array(
      z.object({
        key: z.string().min(1).max(80),
        value: z.unknown(),
        groupName: z.string().max(40).optional(),
        label: z.string().max(120).optional(),
        isPublic: z.boolean().optional(),
      }),
    )
    .min(1),
});

export async function GET(request: Request) {
  try {
    await requirePermission("settings.manage", request);
    const items = await listAdminSiteSettings();
    return jsonOk({ items });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requirePermission("settings.manage", request);
    const body = await parseJsonBody(request, updateSchema);
    const items = await updateAdminSiteSettings({
      updates: body.updates,
      actorUserId: admin.id,
      actorEmail: admin.email,
    });
    return jsonOk({ items });
  } catch (error) {
    return handleApiError(error);
  }
}
