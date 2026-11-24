import type { CustomerDetails, OrderRecord } from "@/types";

const TOKEN_SESSION_KEY = "dodox.order_tokens.v1";

function saveSessionTrackingToken(reference: string, token: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(TOKEN_SESSION_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[reference.toUpperCase()] = token;
    window.sessionStorage.setItem(TOKEN_SESSION_KEY, JSON.stringify(map));
  } catch {
    // Ignore private-browsing storage errors
  }
}

export function getSessionTrackingToken(reference: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(TOKEN_SESSION_KEY);
    if (!raw) return undefined;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[reference.trim().toUpperCase()];
  } catch {
    return undefined;
  }
}

export async function submitOrderRequestToServer(params: {
  customer: CustomerDetails;
  lines: Array<{
    slug: string;
    quantity: number;
    selections: Array<{ groupId: string; optionId: string }>;
  }>;
  careProtection: boolean;
  promoCode?: string | null;
  turnstileToken?: string;
}): Promise<OrderRecord> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: params.customer,
      lines: params.lines,
      careProtection: params.careProtection,
      promoCode: params.promoCode ?? null,
      consent: true,
      turnstileToken: params.turnstileToken,
    }),
  });

  const payload = (await response.json()) as {
    ok: boolean;
    data?: { order: OrderRecord };
    error?: { message: string };
  };

  if (!response.ok || !payload.ok || !payload.data?.order) {
    throw new Error(
      payload.error?.message || "Could not submit your order request.",
    );
  }

  const order = payload.data.order;
  if (order.trackingToken) {
    saveSessionTrackingToken(order.reference, order.trackingToken);
  }
  return order;
}

export async function fetchVerifiedOrder(params: {
  reference: string;
  contact?: string;
  trackingToken?: string;
}): Promise<OrderRecord | null> {
  const response = await fetch("/api/orders/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reference: params.reference.trim().toUpperCase(),
      contact: params.contact?.trim() || undefined,
      trackingToken:
        params.trackingToken || getSessionTrackingToken(params.reference),
    }),
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    ok: boolean;
    data?: {
      order: OrderRecord & {
        history?: Array<{
          status: string;
          label?: string;
          note?: string | null;
          createdAt: string;
        }>;
      };
    };
  };
  if (!payload.ok || !payload.data?.order) return null;
  return {
    ...payload.data.order,
    statusHistory: payload.data.order.history,
  };
}

export async function validateCouponWithServer(
  code: string,
  subtotal: number,
): Promise<{
  code: string;
  label: string;
  description: string;
  amount: number;
}> {
  const response = await fetch("/api/orders/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "coupon",
      code: code.trim(),
      subtotal,
    }),
  });
  const payload = (await response.json()) as {
    ok: boolean;
    data?: {
      coupon: {
        code: string;
        label: string;
        description: string;
        amount: number;
      };
    };
    error?: { message: string };
  };

  if (!response.ok || !payload.ok || !payload.data?.coupon) {
    throw new Error(
      payload.error?.message || "That code is not active or recognised.",
    );
  }
  return payload.data.coupon;
}
