import { z } from "zod";

export const LogMessageSchema = z.object({
  timestamp: z.date(),
  category: z.string(),
  message: z.string(),
});

export const LogMessageSchemaList = z.array(LogMessageSchema);

export type LogMessage = z.infer<typeof LogMessageSchema>;
