import { z } from "zod";

export const updateProgressSchema = z.object({
  progress: z.number().min(0).max(100, "Progress must be between 0 and 100"),
});