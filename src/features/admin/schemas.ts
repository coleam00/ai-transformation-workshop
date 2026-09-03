import { z } from "zod/v4";

export const POLL_STATUSES = ["open", "closed", "archived"] as const;

export const PollStatusSchema = z.enum(POLL_STATUSES);

export type PollStatus = z.infer<typeof PollStatusSchema>;

/**
 * Parse a raw status search-param value, falling back to "open" for
 * anything outside the known enum instead of passing arbitrary text into
 * DB helpers.
 */
export function parsePollStatus(value: string | undefined): PollStatus {
  const result = PollStatusSchema.safeParse(value);
  return result.success ? result.data : "open";
}
