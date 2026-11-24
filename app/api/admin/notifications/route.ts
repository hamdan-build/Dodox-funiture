import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth/rbac";
import { handleApiError, jsonOk, parseJsonBody } from "@/lib/server/http";
import {
  listAdminNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/server/services/audit.service";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const items = await listAdminNotifications(25);
    const unreadCount = items.filter((item) => !item.isRead).length;
    return jsonOk({ notifications: items, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

const patchSchema = z.object({
  id: z.string().optional(),
  markAll: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await parseJsonBody(request, patchSchema);
    if (body.markAll) {
      await markAllNotificationsRead();
    } else if (body.id) {
      await markNotificationRead(body.id);
    }
    return jsonOk({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
