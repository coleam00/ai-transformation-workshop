function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  NODE_ENV: getOptionalEnv("NODE_ENV", "development"),
  LOG_LEVEL: getOptionalEnv("LOG_LEVEL", "info"),
  APP_NAME: getOptionalEnv("APP_NAME", "ai-transformation-workshop-poll-app"),
  DATABASE_URL: getOptionalEnv("DATABASE_URL", "file:./local.db"),
  // Deliberately no default (unlike every other field above): `verifyAdminPassword` fails
  // closed when this is falsy, so it must stay `undefined` when unset. Do NOT wrap this in
  // `getOptionalEnv` with a non-empty default — that would reintroduce a hardcoded,
  // bypassable admin password.
  ADMIN_PASSWORD: process.env["ADMIN_PASSWORD"],
} as const;

export type Env = typeof env;
