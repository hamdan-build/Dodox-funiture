import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getRuntimeEnv } from "@/lib/server/env";
import {
  AppError,
  formatZodIssues,
  RateLimitError,
  ValidationError,
} from "@/lib/server/errors";
import { sha256Hex } from "@/lib/server/ids";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { status: 200, ...init });
}

export function jsonCreated<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { status: 201, ...init });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const details = formatZodIssues(error);
    const firstMessage =
      Object.values(details)[0] ??
      "Please review your submission and try again.";
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: firstMessage,
          details,
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(error.retryAfterSeconds),
        },
      },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode },
    );
  }

  // Log server-side without ever exposing internal SQLite/D1 details or stack traces
  console.error("[DODOX API Unhandled Error]", error);

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          "An unexpected error occurred while processing your request. Please try again.",
      },
    },
    { status: 500 },
  );
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ValidationError("Invalid JSON request body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const details = formatZodIssues(parsed.error);
    const firstMessage =
      Object.values(details)[0] ??
      "Please review the highlighted fields and try again.";
    throw new ValidationError(firstMessage, details);
  }
  return parsed.data;
}

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function getHashedClientIp(request: Request): Promise<string> {
  const ip = getClientIp(request);
  const env = await getRuntimeEnv();
  return (await sha256Hex(`${env.SESSION_SECRET}:ip:${ip}`)).slice(0, 32);
}

export function getUserAgent(request: Request): string {
  return (request.headers.get("user-agent") || "unknown").slice(0, 255);
}
