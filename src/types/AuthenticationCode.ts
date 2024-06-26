import { z } from "zod";
import { authParamsSchema } from "./AuthParams";

export const authenticationCodeSchema = z.object({
  authParams: authParamsSchema,
  nonce: z.string().optional(),
  code: z.string(),
  user_id: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
  used_at: z.string().optional(),
});

export type AuthenticationCode = z.infer<typeof authenticationCodeSchema>;
