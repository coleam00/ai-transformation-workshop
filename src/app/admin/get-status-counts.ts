import { countLegacyPollsByStatus, countPollsByStatus } from "@/features/admin/audit";

export type PollStatus = "open" | "closed" | "archived";

export interface PollStatusCount {
  status: PollStatus;
  liveCount: number;
  allTimeCount: number;
}

function getLegacyCount(status: PollStatus): Promise<number> {
  return new Promise((resolve) => {
    countLegacyPollsByStatus(status, resolve);
  });
}

export async function getPollStatusCounts(
  statuses: readonly PollStatus[],
): Promise<PollStatusCount[]> {
  return Promise.all(
    statuses.map(async (status) => {
      const liveCount = countPollsByStatus(status);
      const allTimeCount = await getLegacyCount(status);
      return { status, liveCount, allTimeCount };
    }),
  );
}
