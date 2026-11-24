import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/server/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  strict: true,
  verbose: true,
});
