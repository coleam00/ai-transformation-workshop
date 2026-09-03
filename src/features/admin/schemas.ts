import { z } from "zod/v4";

export const AdminSearchSchema = z.object({
  q: z.string().trim().min(1, "Search term is required").max(200, "Search term is too long"),
});

export type AdminSearchInput = z.infer<typeof AdminSearchSchema>;
