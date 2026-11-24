import { desc, eq, like, or } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { ensureSeeded } from "@/lib/server/db/seed";
import {
  atelierEnquiries,
  contactMessages,
  customers,
  newsletterSubscribers,
} from "@/lib/server/db/schema";
import { dispatchEmailSafe } from "@/lib/server/email/dispatcher";
import {
  buildAdminAlertEmail,
  buildAtelierEnquiryEmail,
  buildContactAcknowledgementEmail,
  buildNewsletterWelcomeEmail,
} from "@/lib/server/email/templates";
import { getRuntimeEnv } from "@/lib/server/env";
import { NotFoundError, ValidationError } from "@/lib/server/errors";
import { generateId, generateSecureToken, nowIso } from "@/lib/server/ids";
import {
  escapeCsvCell,
  normalizeEmail,
  sanitizeMultilineText,
  sanitizeText,
} from "@/lib/server/security/sanitize";
import {
  createAdminNotification,
  recordActivityLog,
} from "@/lib/server/services/audit.service";

function makeReference(prefix: string): string {
  const year = new Date().getUTCFullYear();
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${suffix}`;
}

export async function submitAtelierEnquiry(params: {
  name: string;
  email: string;
  phone: string;
  furnitureType: string;
  dimensions: string;
  materials: string;
  finish: string;
  budget: string;
  description: string;
  contactPreference: "email" | "phone" | "whatsapp";
  referenceImages?: string[];
  ipHash?: string | null;
}) {
  const db = await getDb();
  await ensureSeeded(db);

  const name = sanitizeText(params.name, 120);
  const email = normalizeEmail(params.email);
  const phone = sanitizeText(params.phone, 32);
  const furnitureType = sanitizeText(params.furnitureType, 120);
  const dimensions = sanitizeText(params.dimensions, 160);
  const materials = sanitizeText(params.materials, 120);
  const finish = sanitizeText(params.finish, 120);
  const budget = sanitizeText(params.budget, 120);
  const description = sanitizeMultilineText(params.description, 3000);

  if (!email || !email.includes("@")) {
    throw new ValidationError("Enter a valid email address.");
  }
  if (description.length < 20) {
    throw new ValidationError("Please share at least 20 characters about your commission.");
  }

  const custRows = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.email, email))
    .limit(1);

  const id = generateId("atl");
  const reference = makeReference("ATL");
  const now = nowIso();
  const safeImages = (params.referenceImages ?? [])
    .slice(0, 4)
    .map((u) => sanitizeText(u, 400))
    .filter(Boolean);

  await db.insert(atelierEnquiries).values({
    id,
    reference,
    customerId: custRows[0]?.id ?? null,
    name,
    email,
    phone,
    furnitureType,
    dimensions,
    materials,
    finish,
    budget,
    description,
    contactPreference: params.contactPreference,
    referenceImagesJson: JSON.stringify(safeImages),
    status: "new",
    isArchived: false,
    ipHash: params.ipHash ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await createAdminNotification({
    category: "atelier",
    title: `Atelier Commission · ${reference}`,
    body: `${name} requested a bespoke ${furnitureType} (${budget}).`,
    href: `/admin/enquiries/atelier`,
  });

  const env = await getRuntimeEnv();
  const clientMail = buildAtelierEnquiryEmail({
    name,
    reference,
    furnitureType,
  });

  await Promise.all([
    dispatchEmailSafe({
      to: email,
      subject: clientMail.subject,
      html: clientMail.html,
      text: clientMail.text,
    }),
    env.ADMIN_NOTIFICATION_EMAIL
      ? (() => {
          const adminMail = buildAdminAlertEmail({
            eventTitle: `New Atelier Commission · ${reference}`,
            summary: `${name} (${email} · ${phone}) submitted a commission brief for ${furnitureType} (${budget}).`,
            adminUrl: `${env.SITE_URL}/admin/enquiries/atelier`,
          });
          return dispatchEmailSafe({
            to: env.ADMIN_NOTIFICATION_EMAIL,
            subject: adminMail.subject,
            html: adminMail.html,
            text: adminMail.text,
          });
        })()
      : Promise.resolve(),
  ]);

  return { id, reference, status: "new", createdAt: now };
}

export async function listAdminAtelierEnquiries(params: {
  status?: string;
  query?: string;
}) {
  const db = await getDb();
  await ensureSeeded(db);

  let whereClause = undefined;
  if (params.query?.trim()) {
    const q = `%${params.query.trim()}%`;
    whereClause = or(
      like(atelierEnquiries.reference, q),
      like(atelierEnquiries.name, q),
      like(atelierEnquiries.email, q),
      like(atelierEnquiries.furnitureType, q),
    );
  }

  const rows = await db
    .select()
    .from(atelierEnquiries)
    .where(whereClause)
    .orderBy(desc(atelierEnquiries.createdAt));

  const filtered =
    params.status && params.status !== "all"
      ? rows.filter((r) => r.status === params.status)
      : rows;

  return filtered.map((r) => ({
    ...r,
    referenceImages: (() => {
      try {
        return JSON.parse(r.referenceImagesJson) as string[];
      } catch {
        return [];
      }
    })(),
  }));
}

export async function updateAdminAtelierEnquiry(params: {
  id: string;
  status?: string;
  quotedAmount?: number | null;
  internalNotes?: string | null;
  isArchived?: boolean;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(atelierEnquiries)
    .where(eq(atelierEnquiries.id, params.id))
    .limit(1);
  const existing = rows[0];
  if (!existing) {
    throw new NotFoundError("Atelier enquiry not found.");
  }

  const nextStatus = params.status ?? existing.status;
  const now = nowIso();
  await db
    .update(atelierEnquiries)
    .set({
      status: nextStatus,
      quotedAmount:
        params.quotedAmount !== undefined
          ? params.quotedAmount !== null
            ? Math.round(params.quotedAmount)
            : null
          : existing.quotedAmount,
      internalNotes:
        params.internalNotes !== undefined
          ? params.internalNotes
            ? sanitizeMultilineText(params.internalNotes, 3000)
            : null
          : existing.internalNotes,
      isArchived:
        params.isArchived !== undefined
          ? params.isArchived
          : existing.isArchived,
      updatedAt: now,
    })
    .where(eq(atelierEnquiries.id, existing.id));

  await recordActivityLog({
    actorUserId: params.actorUserId ?? null,
    actorEmail: params.actorEmail ?? null,
    action: "atelier_enquiry.update",
    resourceType: "atelier_enquiry",
    resourceId: existing.id,
    summary: `Updated Atelier commission ${existing.reference} (${nextStatus})`,
  });

  return { id: existing.id, reference: existing.reference, status: nextStatus };
}

export async function submitContactMessage(params: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  ipHash?: string | null;
}) {
  const db = await getDb();
  await ensureSeeded(db);

  const name = sanitizeText(params.name, 120);
  const email = normalizeEmail(params.email);
  const phone = params.phone ? sanitizeText(params.phone, 32) : null;
  const subject = sanitizeText(params.subject, 160);
  const message = sanitizeMultilineText(params.message, 4000);

  if (!email || !email.includes("@")) {
    throw new ValidationError("Enter a valid email address.");
  }
  if (message.length < 10) {
    throw new ValidationError("Please share a little more detail in your message.");
  }

  const id = generateId("msg");
  const reference = makeReference("MSG");
  const now = nowIso();

  await db.insert(contactMessages).values({
    id,
    reference,
    name,
    email,
    phone,
    subject,
    message,
    isRead: false,
    status: "new",
    ipHash: params.ipHash ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await createAdminNotification({
    category: "contact",
    title: `Concierge Message · ${reference}`,
    body: `${name}: ${subject}`,
    href: `/admin/enquiries/contact`,
  });

  const env = await getRuntimeEnv();
  const ack = buildContactAcknowledgementEmail({
    name,
    reference,
    subjectLine: subject,
  });

  await Promise.all([
    dispatchEmailSafe({
      to: email,
      subject: ack.subject,
      html: ack.html,
      text: ack.text,
    }),
    env.ADMIN_NOTIFICATION_EMAIL
      ? (() => {
          const alert = buildAdminAlertEmail({
            eventTitle: `Contact Message · ${reference}`,
            summary: `${name} (${email}) wrote regarding "${subject}": ${message.slice(0, 240)}`,
            adminUrl: `${env.SITE_URL}/admin/enquiries/contact`,
          });
          return dispatchEmailSafe({
            to: env.ADMIN_NOTIFICATION_EMAIL,
            subject: alert.subject,
            html: alert.html,
            text: alert.text,
          });
        })()
      : Promise.resolve(),
  ]);

  return { id, reference, createdAt: now };
}

export async function listAdminContactMessages(params: {
  status?: string;
  query?: string;
}) {
  const db = await getDb();
  await ensureSeeded(db);

  let whereClause = undefined;
  if (params.query?.trim()) {
    const q = `%${params.query.trim()}%`;
    whereClause = or(
      like(contactMessages.reference, q),
      like(contactMessages.name, q),
      like(contactMessages.email, q),
      like(contactMessages.subject, q),
    );
  }

  const rows = await db
    .select()
    .from(contactMessages)
    .where(whereClause)
    .orderBy(desc(contactMessages.createdAt));

  return params.status && params.status !== "all"
    ? rows.filter((r) => r.status === params.status)
    : rows;
}

export async function updateAdminContactMessage(params: {
  id: string;
  status?: string;
  isRead?: boolean;
  internalNotes?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(contactMessages)
    .where(eq(contactMessages.id, params.id))
    .limit(1);
  const existing = rows[0];
  if (!existing) {
    throw new NotFoundError("Contact message not found.");
  }

  const nextStatus = params.status ?? existing.status;
  await db
    .update(contactMessages)
    .set({
      status: nextStatus,
      isRead: params.isRead ?? true,
      internalNotes:
        params.internalNotes !== undefined
          ? params.internalNotes
            ? sanitizeMultilineText(params.internalNotes, 3000)
            : null
          : existing.internalNotes,
      updatedAt: nowIso(),
    })
    .where(eq(contactMessages.id, existing.id));

  await recordActivityLog({
    actorUserId: params.actorUserId ?? null,
    actorEmail: params.actorEmail ?? null,
    action: "contact_message.update",
    resourceType: "contact_message",
    resourceId: existing.id,
    summary: `Updated contact message ${existing.reference} (${nextStatus})`,
  });

  return { id: existing.id, status: nextStatus };
}

export async function subscribeNewsletter(params: {
  email: string;
  source?: string;
  ipHash?: string | null;
}) {
  const db = await getDb();
  await ensureSeeded(db);

  const email = normalizeEmail(params.email);
  if (!email || !email.includes("@")) {
    throw new ValidationError("Enter a valid email address.");
  }

  const now = nowIso();
  const existing = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  let unsubscribeToken = existing[0]?.unsubscribeToken ?? generateSecureToken(20);
  if (existing[0]) {
    if (existing[0].status === "unsubscribed") {
      unsubscribeToken = generateSecureToken(20);
      await db
        .update(newsletterSubscribers)
        .set({
          status: "active",
          consentGiven: true,
          consentedAt: now,
          unsubscribeToken,
          unsubscribedAt: null,
          updatedAt: now,
        })
        .where(eq(newsletterSubscribers.id, existing[0].id));
    }
  } else {
    await db.insert(newsletterSubscribers).values({
      id: generateId("nsub"),
      email,
      status: "active",
      consentGiven: true,
      consentText: "Private seasonal previews & editorial notes from DODOX Atelier.",
      consentSource: sanitizeText(params.source ?? "storefront", 60),
      consentedAt: now,
      unsubscribeToken,
      ipHash: params.ipHash ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  const env = await getRuntimeEnv();
  const unsubscribeUrl = `${env.SITE_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const welcome = buildNewsletterWelcomeEmail({ unsubscribeUrl });
  await dispatchEmailSafe({
    to: email,
    subject: welcome.subject,
    html: welcome.html,
    text: welcome.text,
  });

  return { email, status: "active" };
}

export async function unsubscribeNewsletterByToken(token: string) {
  const db = await getDb();
  const clean = token.trim();
  if (!clean) {
    throw new ValidationError("Invalid unsubscribe link.");
  }
  const rows = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.unsubscribeToken, clean))
    .limit(1);
  if (!rows[0]) {
    throw new NotFoundError("Subscription token not found.");
  }

  const now = nowIso();
  await db
    .update(newsletterSubscribers)
    .set({
      status: "unsubscribed",
      unsubscribedAt: now,
      updatedAt: now,
    })
    .where(eq(newsletterSubscribers.id, rows[0].id));

  return { email: rows[0].email, status: "unsubscribed" };
}

export async function listAdminNewsletterSubscribers(params: {
  status?: string;
  query?: string;
}) {
  const db = await getDb();
  await ensureSeeded(db);

  let whereClause = undefined;
  if (params.query?.trim()) {
    whereClause = like(newsletterSubscribers.email, `%${params.query.trim()}%`);
  }

  const rows = await db
    .select()
    .from(newsletterSubscribers)
    .where(whereClause)
    .orderBy(desc(newsletterSubscribers.createdAt));

  return params.status && params.status !== "all"
    ? rows.filter((r) => r.status === params.status)
    : rows;
}

export async function exportNewsletterCsv(): Promise<string> {
  const rows = await listAdminNewsletterSubscribers({});
  const header = ["Email", "Status", "Source", "Consented At", "Unsubscribed At"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        escapeCsvCell(r.email),
        escapeCsvCell(r.status),
        escapeCsvCell(r.consentSource),
        escapeCsvCell(r.consentedAt),
        escapeCsvCell(r.unsubscribedAt ?? ""),
      ].join(","),
    ),
  ];
  return lines.join("\n");
}
