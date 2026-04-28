import { describe, expect, it } from "bun:test";

import { createPaginatedResponse, getOffset, PaginationParamsSchema } from "./pagination";

describe("PaginationParamsSchema", () => {
  it("applies default values", () => {
    const result = PaginationParamsSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("accepts valid values", () => {
    const result = PaginationParamsSchema.parse({ page: 5, pageSize: 50 });
    expect(result.page).toBe(5);
    expect(result.pageSize).toBe(50);
  });

  it("rejects page less than 1", () => {
    expect(() => PaginationParamsSchema.parse({ page: 0 })).toThrow();
    expect(() => PaginationParamsSchema.parse({ page: -1 })).toThrow();
  });

  it("rejects pageSize less than 1", () => {
    expect(() => PaginationParamsSchema.parse({ pageSize: 0 })).toThrow();
  });

  it("rejects pageSize greater than 100", () => {
    expect(() => PaginationParamsSchema.parse({ pageSize: 101 })).toThrow();
  });

  it("rejects non-integer values", () => {
    expect(() => PaginationParamsSchema.parse({ page: 1.5 })).toThrow();
    expect(() => PaginationParamsSchema.parse({ pageSize: 20.5 })).toThrow();
  });
});

describe("getOffset", () => {
  it("calculates offset for first page", () => {
    expect(getOffset({ page: 1, pageSize: 20 })).toBe(0);
  });

  it("calculates offset for second page", () => {
    expect(getOffset({ page: 2, pageSize: 20 })).toBe(20);
  });

  it("calculates offset for custom page size", () => {
    expect(getOffset({ page: 3, pageSize: 10 })).toBe(20);
  });

  it("calculates offset for large page number", () => {
    expect(getOffset({ page: 10, pageSize: 50 })).toBe(450);
  });
});

describe("createPaginatedResponse", () => {
  it("creates response with pagination metadata", () => {
    const items = [{ id: 1 }, { id: 2 }];
    const result = createPaginatedResponse(items, 50, { page: 1, pageSize: 20 });

    expect(result.items).toEqual(items);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.pageSize).toBe(20);
    expect(result.pagination.total).toBe(50);
    expect(result.pagination.totalPages).toBe(3);
  });

  it("calculates totalPages correctly for exact division", () => {
    const result = createPaginatedResponse([], 100, { page: 1, pageSize: 20 });
    expect(result.pagination.totalPages).toBe(5);
  });

  it("calculates totalPages correctly for partial page", () => {
    const result = createPaginatedResponse([], 101, { page: 1, pageSize: 20 });
    expect(result.pagination.totalPages).toBe(6);
  });

  it("handles empty results", () => {
    const result = createPaginatedResponse([], 0, { page: 1, pageSize: 20 });
    expect(result.items).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });
});
