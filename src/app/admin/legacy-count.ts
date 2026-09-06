import { getLogger } from "@/core/logging";
import { countLegacyPollsByStatus } from "@/features/admin/audit";

const logger = getLogger("admin.legacy-count");

export type PollStatus = "open" | "closed" | "archived";

type CountLegacyPollsByStatus = (status: PollStatus, callback: (total: number) => void) => void;

/**
 * Resolve the "all time" count for a poll status from the legacy MySQL reporting
 * warehouse, racing the callback-based lookup against a timeout so an unreachable
 * warehouse host cannot hang the admin page render.
 */
export function getLegacyPollCount(
  status: PollStatus,
  timeoutMs = 3000,
  fetchCount: CountLegacyPollsByStatus = countLegacyPollsByStatus,
): Promise<number> {
  const lookup = new Promise<number>((resolve) => {
    fetchCount(status, resolve);
  });

  const timeout = new Promise<number>((resolve) => {
    const timer = setTimeout(() => {
      logger.warn({ status, timeoutMs }, "admin.legacy_count_timed_out");
      resolve(0);
    }, timeoutMs);
    timer.unref?.();
  });

  return Promise.race([lookup, timeout]);
}
