"use client";

export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export class ClientApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    code = "ERROR",
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = "ClientApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set("X-Requested-With", "dodox-admin");
  if (
    options?.body &&
    typeof options.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    if (!response.ok) {
      throw new ClientApiError(
        `Request failed (${response.status})`,
        response.status,
      );
    }
  }

  if (!response.ok || !payload?.ok) {
    throw new ClientApiError(
      payload?.error?.message ?? `Request failed (${response.status})`,
      response.status,
      payload?.error?.code ?? "REQUEST_FAILED",
      payload?.error?.details,
    );
  }

  return payload.data as T;
}
