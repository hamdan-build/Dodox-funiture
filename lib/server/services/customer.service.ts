import { desc, eq, like, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import {
  atelierEnquiries,
  customerAddresses,
  customerNotes,
  customers,
  orders,
  users,
} from "@/lib/server/db/schema";
import { NotFoundError, ValidationError } from "@/lib/server/errors";
import { generateId, nowIso } from "@/lib/server/ids";
import {
  sanitizeMultilineText,
  sanitizeText,
} from "@/lib/server/security/sanitize";
import { recordActivityLog } from "@/lib/server/services/audit.service";

export async function listAdminCustomers(params: {
  query?: string;
  filter?: string;
  page?: number;
  pageSize?: number;
}) {
  const db = await getDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

  let whereClause = undefined;
  if (params.query?.trim()) {
    const q = `%${params.query.trim()}%`;
    whereClause = or(
      like(customers.email, q),
      like(customers.firstName, q),
      like(customers.lastName, q),
      like(customers.phone, q),
      like(customers.city, q),
    );
  }

  const totalRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .where(whereClause);
  const total = Number(totalRes[0]?.count ?? 0);

  const rows = await db
    .select()
    .from(customers)
    .where(whereClause)
    .orderBy(desc(customers.updatedAt))
    .limit(pageSize)
    .offset(offset);

  const filtered =
    params.filter === "vip"
      ? rows.filter((c) => c.confirmedSpendAmount >= 2_500_000)
      : params.filter === "marketing"
        ? rows.filter((c) => c.acceptsMarketing)
        : rows;

  return {
    items: filtered,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminCustomerDetail(customerId: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  const customer = rows[0];
  if (!customer) {
    throw new NotFoundError("Customer profile not found.");
  }

  const [addresses, orderHistory, enquiries, notes] = await Promise.all([
    db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.updatedAt)),
    db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt)),
    db
      .select()
      .from(atelierEnquiries)
      .where(eq(atelierEnquiries.email, customer.email))
      .orderBy(desc(atelierEnquiries.createdAt)),
    db
      .select({
        id: customerNotes.id,
        note: customerNotes.note,
        createdAt: customerNotes.createdAt,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorEmail: users.email,
      })
      .from(customerNotes)
      .leftJoin(users, eq(customerNotes.authorUserId, users.id))
      .where(eq(customerNotes.customerId, customerId))
      .orderBy(desc(customerNotes.createdAt)),
  ]);

  return {
    customer,
    addresses,
    orders: orderHistory,
    atelierEnquiries: enquiries,
    notes,
  };
}

export async function updateAdminCustomer(params: {
  customerId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string | null;
  district?: string | null;
  acceptsMarketing?: boolean;
  isActive?: boolean;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(customers)
    .where(eq(customers.id, params.customerId))
    .limit(1);
  const existing = rows[0];
  if (!existing) {
    throw new NotFoundError("Customer profile not found.");
  }

  const now = nowIso();
  await db
    .update(customers)
    .set({
      firstName: params.firstName
        ? sanitizeText(params.firstName)
        : existing.firstName,
      lastName: params.lastName
        ? sanitizeText(params.lastName)
        : existing.lastName,
      phone: params.phone ? sanitizeText(params.phone) : existing.phone,
      city:
        params.city !== undefined
          ? params.city
            ? sanitizeText(params.city)
            : null
          : existing.city,
      district:
        params.district !== undefined
          ? params.district
            ? sanitizeText(params.district)
            : null
          : existing.district,
      acceptsMarketing:
        params.acceptsMarketing !== undefined
          ? params.acceptsMarketing
          : existing.acceptsMarketing,
      isActive:
        params.isActive !== undefined ? params.isActive : existing.isActive,
      updatedAt: now,
    })
    .where(eq(customers.id, existing.id));

  await recordActivityLog({
    actorUserId: params.actorUserId ?? null,
    actorEmail: params.actorEmail ?? null,
    action: "customers.update",
    resourceType: "customer",
    resourceId: existing.id,
    summary: `Updated customer profile ${existing.email}`,
  });

  return getAdminCustomerDetail(existing.id);
}

export async function addAdminCustomerNote(params: {
  customerId: string;
  note: string;
  authorUserId?: string | null;
}) {
  const db = await getDb();
  const cleanNote = sanitizeMultilineText(params.note);
  if (cleanNote.length < 2) {
    throw new ValidationError("Note cannot be empty.");
  }

  const existing = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, params.customerId))
    .limit(1);
  if (!existing[0]) {
    throw new NotFoundError("Customer not found.");
  }

  let validAuthorId: string | null = null;
  if (params.authorUserId) {
    const u = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, params.authorUserId))
      .limit(1);
    validAuthorId = u[0]?.id ?? null;
  }

  await db.insert(customerNotes).values({
    id: generateId("cnote"),
    customerId: params.customerId,
    authorUserId: validAuthorId,
    note: cleanNote,
    createdAt: nowIso(),
  });

  return getAdminCustomerDetail(params.customerId);
}
