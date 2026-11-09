import type { OrderRecord } from "@/types";

/**
 * Order-request persistence for the frontend demonstration.
 *
 * The order request is intentionally isolated behind this module so a real
 * backend (email service, ERP, headless commerce API) can be wired in later
 * without touching the checkout UI. Nothing here contacts a server and no
 * payment data is collected or stored.
 */

const STORAGE_KEY = "dodox.orders.v1";

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readAll = (): Record<string, OrderRecord> => {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, OrderRecord>;
  } catch {
    return {};
  }
};

const writeAll = (orders: Record<string, OrderRecord>) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Storage can be unavailable in private browsing — the UI still works.
  }
};

export function generateOrderReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let index = 0; index < 6; index += 1) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `DODO-${token}`;
}

export async function submitOrderRequest(
  order: Omit<OrderRecord, "reference" | "createdAt" | "status">,
): Promise<OrderRecord> {
  const record: OrderRecord = {
    ...order,
    reference: generateOrderReference(),
    createdAt: new Date().toISOString(),
    status: "received",
  };
  const orders = readAll();
  orders[record.reference] = record;
  writeAll(orders);
  // Simulated network latency so loading states can be reviewed.
  await new Promise((resolve) => setTimeout(resolve, 700));
  return record;
}

export function getOrder(reference: string): OrderRecord | null {
  const orders = readAll();
  const normalised = reference.trim().toUpperCase();
  return orders[normalised] ?? null;
}

export function findOrderForCustomer(
  reference: string,
  contact: string,
): OrderRecord | null {
  const order = getOrder(reference);
  if (!order) return null;
  const normalised = contact.trim().toLowerCase();
  const email = order.customer.email.toLowerCase();
  const phone = order.customer.phone.replace(/[^\d]/g, "");
  const digits = normalised.replace(/[^\d]/g, "");
  if (normalised === email) return order;
  if (digits && digits === phone) return order;
  return null;
}

export function latestOrder(): OrderRecord | null {
  const orders = readAll();
  const list = Object.values(orders).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return list[0] ?? null;
}
