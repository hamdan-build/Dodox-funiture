import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import * as schema from "../lib/server/db/schema";
import { runFullSeed } from "../lib/server/db/seed";

async function main() {
  const proxy = await getPlatformProxy<CloudflareEnv>({
    remoteBindings: false,
  });

  try {
    const db = drizzle(proxy.env.DB, { schema });
    await runFullSeed(db);

    const [
      roleCount,
      permCount,
      catCount,
      colCount,
      prodCount,
      couponCount,
      journalCount,
      settingsCount,
    ] = await Promise.all([
      db.select({ v: count() }).from(schema.roles),
      db.select({ v: count() }).from(schema.permissions),
      db.select({ v: count() }).from(schema.categories),
      db.select({ v: count() }).from(schema.collections),
      db.select({ v: count() }).from(schema.products),
      db.select({ v: count() }).from(schema.coupons),
      db.select({ v: count() }).from(schema.journalPosts),
      db.select({ v: count() }).from(schema.siteSettings),
    ]);

    console.log("Local Cloudflare D1 seeded successfully:");
    console.log(`  Roles:         ${roleCount[0]?.v ?? 0}`);
    console.log(`  Permissions:   ${permCount[0]?.v ?? 0}`);
    console.log(`  Categories:    ${catCount[0]?.v ?? 0}`);
    console.log(`  Collections:   ${colCount[0]?.v ?? 0}`);
    console.log(`  Products:      ${prodCount[0]?.v ?? 0}`);
    console.log(`  Coupons:       ${couponCount[0]?.v ?? 0}`);
    console.log(`  Journal Posts: ${journalCount[0]?.v ?? 0}`);
    console.log(`  Site Settings: ${settingsCount[0]?.v ?? 0}`);
  } finally {
    await proxy.dispose();
  }
}

main().catch((error) => {
  console.error("Failed to seed local D1:", error);
  process.exit(1);
});
