import { describe, expect, it, mock } from "bun:test";
import { render, screen, within } from "@testing-library/react";

mock.module("@/features/admin/audit", () => ({
  getPollsByStatus: () => [],
  countPollsByStatus: (status: string) =>
    ({ open: 3, closed: 1, archived: 0 })[status as "open" | "closed" | "archived"] ?? 0,
  countLegacyPollsByStatus: (status: string, callback: (total: number) => void) => {
    callback({ open: 30, closed: 10, archived: 5 }[status as "open" | "closed" | "archived"] ?? 0);
  },
}));

const { default: AdminPage } = await import("@/app/admin/page");

describe("AdminPage", () => {
  it("renders a card per status with live and all-time counts", async () => {
    render(await AdminPage({ searchParams: Promise.resolve({}) }));

    const openCard = screen.getByText("Open").closest('[data-slot="card"]') as HTMLElement;
    expect(within(openCard).getByText("3")).toBeInTheDocument();
    expect(within(openCard).getByText("All time: 30")).toBeInTheDocument();

    const closedCard = screen.getByText("Closed").closest('[data-slot="card"]') as HTMLElement;
    expect(within(closedCard).getByText("1")).toBeInTheDocument();
    expect(within(closedCard).getByText("All time: 10")).toBeInTheDocument();

    const archivedCard = screen.getByText("Archived").closest('[data-slot="card"]') as HTMLElement;
    expect(within(archivedCard).getByText("0")).toBeInTheDocument();
    expect(within(archivedCard).getByText("All time: 5")).toBeInTheDocument();
  });
});
