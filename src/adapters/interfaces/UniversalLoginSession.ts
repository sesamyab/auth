import { z } from "zod";
import { AuthParams, authParamsSchema } from "../../types";

export const universalLoginSessionSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  client_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  expires_at: z.string(),
  authParams: authParamsSchema,
  username: z.string().optional(),
});

export interface UniversalLoginSession {
  id: string;
  tenant_id: string;
  client_id: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  authParams: AuthParams;
  username?: string;
}

export interface UniversalLoginSessionsAdapter {
  create: (session: UniversalLoginSession) => Promise<void>;
  update: (id: string, session: UniversalLoginSession) => Promise<boolean>;
  get: (id: string) => Promise<UniversalLoginSession | null>;
}
