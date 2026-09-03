import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

mock.module("@/features/admin/audit", () => ({
  getPollsByStatus: () => [],
  countPollsByStatus: (status: string) => (status === "open" ? 3 : 0),
  countLegacyPollsByStatus: (status: string, cb: (n: number) => void) =>
    cb(status === "open" ? 30 : 0),
}));

const { default: AdminPage } = await import("@/app/admin/page");

describe("AdminPage stats cards", () => {
  it("renders live and all-time counts per status", async () => {
    const element = await AdminPage({ searchParams: Promise.resolve({}) });
    render(element);

    // "open" also appears in the existing filter nav link, so scope the
    // assertion to the stat card titles rather than using getByText, which
    // requires a single match.
    const cardTitles = Array.from(document.querySelectorAll('[data-slot="card-title"]')).map(
      (node) => node.textContent,
    );
    expect(cardTitles).toContain("open");
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });
});
