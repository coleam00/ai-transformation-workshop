function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  NODE_ENV: getOptionalEnv("NODE_ENV", "development"),
  LOG_LEVEL: getOptionalEnv("LOG_LEVEL", "info"),
  APP_NAME: getOptionalEnv("APP_NAME", "ai-transformation-workshop-poll-app"),
  DATABASE_URL: getOptionalEnv("DATABASE_URL", "file:./local.db"),
} as const;

export type Env = typeof env;
