export const POLL_STATUSES = ["open", "closed", "archived"] as const;

export type PollStatus = (typeof POLL_STATUSES)[number];

export function isPollStatus(value: string): value is PollStatus {
  return (POLL_STATUSES as readonly string[]).includes(value);
}

export function resolveStatus(value: string | undefined): PollStatus {
  if (value !== undefined && isPollStatus(value)) {
    return value;
  }
  return "open";
}
