import { z } from "zod";

export const totalsSchema = z.object({
  start: z.number(),
  limit: z.number(),
  length: z.number(),
});

export type Totals = z.infer<typeof totalsSchema>;
