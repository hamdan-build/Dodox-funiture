/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    /** Primary Cloudflare D1 SQLite database */
    DB: D1Database;
    /** Cloudflare R2 object bucket for product & enquiry media */
    MEDIA_BUCKET?: R2Bucket;
    /** Optional Cloudflare KV namespace for edge caching */
    CACHE_KV?: KVNamespace;
    /** Optional Cloudflare Queue for background notification delivery */
    NOTIFICATION_QUEUE?: Queue;

    /** Runtime & Security Configuration */
    APP_ENV?: "development" | "staging" | "production";
    NEXT_PUBLIC_SITE_URL?: string;
    NEXT_PUBLIC_MEDIA_BASE_URL?: string;
    SESSION_SECRET?: string;
    ADMIN_BOOTSTRAP_TOKEN?: string;
    TURNSTILE_SECRET_KEY?: string;
    NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    ADMIN_NOTIFICATION_EMAIL?: string;
  }
}

export {};
