/**
 * Get current UTC date/time.
 */
export function utcNow(): Date {
  return new Date();
}

/**
 * Format a date to ISO 8601 string.
 */
export function formatIso(date: Date): string {
  return date.toISOString();
}

/**
 * Parse an ISO 8601 string to Date.
 * Throws if the string is invalid.
 */
export function parseIso(str: string): Date {
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date string: ${str}`);
  }
  return date;
}
