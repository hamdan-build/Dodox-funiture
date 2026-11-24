import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/lib/server/db/schema";
import { getRuntimeEnv } from "@/lib/server/env";

export type DbClient = DrizzleD1Database<typeof schema>;

export async function getD1Binding(): Promise<D1Database> {
  const env = await getRuntimeEnv();
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 database binding `DB` is unavailable. Run `npm run db:migrate:local` for local development or configure `d1_databases` in wrangler.jsonc.",
    );
  }
  return env.DB;
}

export async function getDb(): Promise<DbClient> {
  const d1 = await getD1Binding();
  return drizzle(d1, { schema });
}
