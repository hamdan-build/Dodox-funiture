import { eq, lt } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { rateLimits } from "@/lib/server/db/schema";
import { RateLimitError } from "@/lib/server/errors";

export interface RateLimitOptions {
  namespace: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
  message?: string;
}

/**
 * D1-backed fixed-window rate limiter designed for stateless Cloudflare Workers isolates.
 */
export async function enforceRateLimit(
  options: RateLimitOptions,
): Promise<void> {
  const db = await getDb();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const bucketKey = `${options.namespace}:${options.identifier}`;

  // Opportunistic cleanup of expired buckets (~2% of calls)
  if (Math.random() < 0.02) {
    await db
      .delete(rateLimits)
      .where(lt(rateLimits.expiresAt, nowSeconds))
      .catch(() => undefined);
  }

  const existing = await db.query.rateLimits.findFirst({
    where: eq(rateLimits.bucketKey, bucketKey),
  });

  if (!existing || existing.expiresAt <= nowSeconds) {
    const expiresAt = nowSeconds + options.windowSeconds;
    await db
      .insert(rateLimits)
      .values({
        bucketKey,
        hitCount: 1,
        windowStartedAt: nowSeconds,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: rateLimits.bucketKey,
        set: {
          hitCount: 1,
          windowStartedAt: nowSeconds,
          expiresAt,
        },
      });
    return;
  }

  if (existing.hitCount >= options.limit) {
    const retryAfter = Math.max(1, existing.expiresAt - nowSeconds);
    throw new RateLimitError(
      options.message ??
        "Too many attempts in a short period. Please wait and try again.",
      retryAfter,
    );
  }

  await db
    .update(rateLimits)
    .set({ hitCount: existing.hitCount + 1 })
    .where(eq(rateLimits.bucketKey, bucketKey));
}
