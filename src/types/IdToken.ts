import { z } from "zod";

export const idTokenSchema = z.object({
  iss: z.string(),
  azp: z.string(),
  aud: z.string(),
  sub: z.string().optional(),
  email: z.string().optional(),
  email_verified: z.boolean().optional(),
  at_hash: z.string(),
  iat: z.number(),
  exp: z.number(),
  hd: z.string().optional(),
  jti: z.string(),
  nonce: z.string(),
  auth_time: z.number(),
  nonce_supported: z.boolean(),
  // Define the rest of the profileData schema here
  profileData: z.record(z.any()),
});

export type IdToken = z.infer<typeof idTokenSchema>;
