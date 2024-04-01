import { z } from "zod";

export const jwksSchema = z.object({
  alg: z.string(),
  e: z.string(),
  kid: z.string(),
  kty: z.string(),
  n: z.string(),
  use: z.string(),
});

export type Jwks = z.infer<typeof jwksSchema>;

export interface JwksKeys {
  keys: Jwks[];
}
