import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";

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
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  return token;
}

export async function getVoterToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}
