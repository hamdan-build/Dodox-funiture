import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { activityLogs, notifications } from "@/lib/server/db/schema";
import { getHashedClientIp, getUserAgent } from "@/lib/server/http";
import { generateId, nowIso } from "@/lib/server/ids";

export interface RecordActivityInput {
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  summary: string;
  before?: unknown;
  after?: unknown;
  request?: Request;
}

export async function recordActivityLog(
  input: RecordActivityInput,
): Promise<void> {
  try {
    const db = await getDb();
    const ipHash = input.request
      ? await getHashedClientIp(input.request)
      : null;
    const userAgent = input.request ? getUserAgent(input.request) : null;

    await db.insert(activityLogs).values({
      id: generateId("act"),
      actorUserId: input.actorUserId ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      summary: input.summary.slice(0, 500),
      beforeJson:
        input.before !== undefined ? JSON.stringify(input.before) : null,
      afterJson: input.after !== undefined ? JSON.stringify(input.after) : null,
      ipHash,
      userAgent,
      createdAt: nowIso(),
    });
  } catch (err) {
    console.error("[DODOX Audit Log Failure]", err);
  }
}

export async function createAdminNotification(input: {
  recipientUserId?: string | null;
  category: string;
  title: string;
  body: string;
  href?: string;
}): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(notifications).values({
      id: generateId("ntf"),
      recipientUserId: input.recipientUserId ?? null,
      category: input.category,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      isRead: false,
      readAt: null,
      createdAt: nowIso(),
    });
  } catch (err) {
    console.error("[DODOX Notification Failure]", err);
  }
}

export async function listRecentActivityLogs(limit = 100) {
  const db = await getDb();
  return db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

export async function listAdminNotifications(limit = 30) {
  const db = await getDb();
  return db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationRead(id: string) {
  const db = await getDb();
  await db
    .update(notifications)
    .set({ isRead: true, readAt: nowIso() })
    .where(eq(notifications.id, id));
}

export async function markAllNotificationsRead() {
  const db = await getDb();
  await db
    .update(notifications)
    .set({ isRead: true, readAt: nowIso() })
    .where(eq(notifications.isRead, false));
}
