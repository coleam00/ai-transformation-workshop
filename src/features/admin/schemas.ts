import { z } from "zod/v4";

export const POLL_STATUS_VALUES = ["open", "closed", "archived"] as const;

export const PollStatusSchema = z.enum(POLL_STATUS_VALUES);

export type PollStatus = z.infer<typeof PollStatusSchema>;
