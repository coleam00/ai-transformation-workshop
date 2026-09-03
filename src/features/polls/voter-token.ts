import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import { env } from "@/core/config/env";

const COOKIE_NAME = "poll_voter_token";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getOrCreateVoterToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing && existing.length > 0) {
    return existing;
  }
  const token = randomUUID();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    // Prevents the token from ever being sent over unencrypted HTTP, where a
    // network attacker could observe and replay it. Only relaxed in
    // non-production so local http://localhost dev still works.
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  return token;
}

export async function getVoterToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}
