import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface RuntimeEnv {
  DB?: D1Database;
  MEDIA_BUCKET?: R2Bucket;
  CACHE_KV?: KVNamespace;
  NOTIFICATION_QUEUE?: Queue;
  APP_ENV: "development" | "staging" | "production";
  SITE_URL: string;
  MEDIA_BASE_URL: string;
  SESSION_SECRET: string;
  ADMIN_BOOTSTRAP_TOKEN?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM: string;
  ADMIN_NOTIFICATION_EMAIL: string;
}

const DEV_FALLBACK_SESSION_SECRET =
  "dodox-local-dev-only-session-secret-do-not-use-in-production-32b";

export async function getCloudflareBindings(): Promise<{
  env?: CloudflareEnv;
  ctx?: ExecutionContext;
}> {
  try {
    const context = await getCloudflareContext({ async: true });
    return { env: context.env, ctx: context.ctx };
  } catch {
    const globalSym = Symbol.for("__cloudflare-context__");
    const fallback = (globalThis as Record<symbol, unknown>)[globalSym] as
      | { env?: CloudflareEnv; ctx?: ExecutionContext }
      | undefined;
    return { env: fallback?.env, ctx: fallback?.ctx };
  }
}

export async function getRuntimeEnv(): Promise<RuntimeEnv> {
  const { env } = await getCloudflareBindings();
  const rawAppEnv =
    env?.APP_ENV ??
    process.env.APP_ENV ??
    (process.env.NODE_ENV === "production" ? "production" : "development");

  const appEnv: RuntimeEnv["APP_ENV"] =
    rawAppEnv === "production" || rawAppEnv === "staging"
      ? rawAppEnv
      : "development";

  const rawSessionSecret =
    env?.SESSION_SECRET ?? process.env.SESSION_SECRET ?? "";

  if (appEnv === "production" && rawSessionSecret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be configured with at least 32 characters in production.",
    );
  }

  return {
    DB: env?.DB,
    MEDIA_BUCKET: env?.MEDIA_BUCKET,
    CACHE_KV: env?.CACHE_KV,
    NOTIFICATION_QUEUE: env?.NOTIFICATION_QUEUE,
    APP_ENV: appEnv,
    SITE_URL: (
      env?.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000"
    ).replace(/\/$/, ""),
    MEDIA_BASE_URL: (
      env?.NEXT_PUBLIC_MEDIA_BASE_URL ??
      process.env.NEXT_PUBLIC_MEDIA_BASE_URL ??
      ""
    ).replace(/\/$/, ""),
    SESSION_SECRET:
      rawSessionSecret.length >= 32
        ? rawSessionSecret
        : DEV_FALLBACK_SESSION_SECRET,
    ADMIN_BOOTSTRAP_TOKEN:
      env?.ADMIN_BOOTSTRAP_TOKEN ?? process.env.ADMIN_BOOTSTRAP_TOKEN,
    TURNSTILE_SECRET_KEY:
      env?.TURNSTILE_SECRET_KEY ?? process.env.TURNSTILE_SECRET_KEY,
    TURNSTILE_SITE_KEY:
      env?.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    RESEND_API_KEY: env?.RESEND_API_KEY ?? process.env.RESEND_API_KEY,
    EMAIL_FROM:
      env?.EMAIL_FROM ??
      process.env.EMAIL_FROM ??
      "DODOX Atelier <concierge@dodox.rw>",
    ADMIN_NOTIFICATION_EMAIL:
      env?.ADMIN_NOTIFICATION_EMAIL ??
      process.env.ADMIN_NOTIFICATION_EMAIL ??
      "concierge@dodox.rw",
  };
}
