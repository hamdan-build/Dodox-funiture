import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { ensureSeeded } from "@/lib/server/db/seed";
import { siteSettings, users } from "@/lib/server/db/schema";
import { nowIso } from "@/lib/server/ids";
import { sanitizeText } from "@/lib/server/security/sanitize";
import { recordActivityLog } from "@/lib/server/services/audit.service";

export interface SiteSettingEntry {
  key: string;
  value: unknown;
  groupName: string;
  label: string;
  isPublic: boolean;
  updatedAt: string;
}

export async function listAdminSiteSettings(): Promise<SiteSettingEntry[]> {
  const db = await getDb();
  await ensureSeeded(db);
  const rows = await db
    .select()
    .from(siteSettings)
    .orderBy(asc(siteSettings.groupName), asc(siteSettings.key));

  return rows.map((r) => {
    let parsed: unknown = r.valueJson;
    try {
      parsed = JSON.parse(r.valueJson);
    } catch {
      parsed = r.valueJson;
    }
    return {
      key: r.key,
      value: parsed,
      groupName: r.groupName,
      label: r.label,
      isPublic: r.isPublic,
      updatedAt: r.updatedAt,
    };
  });
}

export async function updateAdminSiteSettings(params: {
  updates: {
    key: string;
    value: unknown;
    groupName?: string;
    label?: string;
    isPublic?: boolean;
  }[];
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  const db = await getDb();
  await ensureSeeded(db);
  const now = nowIso();

  let validActorId: string | null = null;
  if (params.actorUserId) {
    const u = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, params.actorUserId))
      .limit(1);
    validActorId = u[0]?.id ?? null;
  }

  for (const item of params.updates) {
    const key = sanitizeText(item.key, 80).replace(/[^a-z0-9_.-]/gi, "_");
    if (!key) continue;
    const existing = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);

    const valueJson = JSON.stringify(item.value);
    if (existing[0]) {
      await db
        .update(siteSettings)
        .set({
          valueJson,
          updatedByUserId: validActorId,
          updatedAt: now,
        })
        .where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({
        key,
        valueJson,
        groupName: sanitizeText(item.groupName ?? "general", 40),
        label: sanitizeText(item.label ?? key, 120),
        isPublic: item.isPublic ?? true,
        updatedByUserId: validActorId,
        updatedAt: now,
      });
    }
  }

  await recordActivityLog({
    actorUserId: validActorId,
    actorEmail: params.actorEmail ?? null,
    action: "settings.update",
    resourceType: "site_settings",
    summary: `Updated ${params.updates.length} website configuration setting(s)`,
    after: params.updates.map((u) => u.key),
  });

  return listAdminSiteSettings();
}
