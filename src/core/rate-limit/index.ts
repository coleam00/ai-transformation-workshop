/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Anonymous, cookie-based actions (creating polls, casting votes) have no real
 * identity to authorize against, so a self-issued cookie alone can't stop abuse:
 * an attacker who drops the cookie is silently issued a fresh one and starts
 * over. Rate-limiting by client IP adds a barrier that isn't defeated by simply
 * clearing cookies, bounding how much damage a single anonymous client can do.
 *
 * Note: this is per-process state, adequate for this single-instance demo app.
 * A multi-instance deployment would need a shared store (e.g. Redis).
 */

import { headers } from "next/headers";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Best-effort client IP for rate-limit keying. Trusts the `x-forwarded-for` /
 * `x-real-ip` headers set by the reverse proxy in front of the app; falls back
 * to a constant so the app degrades to a single shared bucket instead of
 * throwing when neither header is present (e.g. local dev without a proxy).
 */
export async function getClientIp(): Promise<string> {
  const store = await headers();
  const forwardedFor = store.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  return store.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}
