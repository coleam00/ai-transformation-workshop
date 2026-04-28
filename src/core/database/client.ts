import BetterSqlite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { env } from "@/core/config/env";

import * as schema from "./schema";

function resolveDatabasePath(databaseUrl: string): string {
  return databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl;
}

const sqlite = new BetterSqlite3(resolveDatabasePath(env.DATABASE_URL));
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export type DatabaseClient = typeof db;
