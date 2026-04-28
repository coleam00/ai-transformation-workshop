import { z } from "zod/v4";

/**
 * Pagination parameters schema.
 * Used for list endpoints to control page size and offset.
 */
export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

/**
 * Calculate database offset from pagination params.
 */
export function getOffset(params: PaginationParams): number {
  return (params.page - 1) * params.pageSize;
}

/**
 * Paginated response wrapper type.
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create a paginated response from items and total count.
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  params: PaginationParams,
): PaginatedResponse<T> {
  return {
    items,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize),
    },
  };
}
