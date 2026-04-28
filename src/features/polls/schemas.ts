import { z } from "zod/v4";

export const CreatePollSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  description: z
    .string()
    .trim()
    .max(1000, "Description is too long")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  options: z
    .array(z.string().trim().min(1, "Option text required").max(200, "Option text too long"))
    .min(2, "At least two options are required")
    .max(20, "At most 20 options"),
});

export type CreatePollInput = z.infer<typeof CreatePollSchema>;

export const CastVoteSchema = z.object({
  pollId: z.string().min(1),
  optionId: z.string().min(1),
  voterToken: z.string().min(1).max(128),
});

export type CastVoteInput = z.infer<typeof CastVoteSchema>;
