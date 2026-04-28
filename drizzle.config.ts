import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env["DATABASE_URL"] ?? "file:./local.db";
const url = databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl;

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/core/database/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url,
  },
});
