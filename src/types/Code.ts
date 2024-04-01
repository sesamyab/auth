import { z } from "zod";

export const codeSchema = z.object({
  id: z.string(),
  code: z.string(),
  type: z.enum(["password_reset", "validation"]),
  created_at: z.string(),
  expires_at: z.string(),
  used_at: z
    .string()
    .optional()
    .transform((val) => (val === null ? undefined : val)),
  user_id: z.string(),
});

export interface Code {
  id: string;
  code: string;
  type: "password_reset" | "validation";
  created_at: string;
  expires_at: string;
  used_at?: string;
  user_id: string;
}
