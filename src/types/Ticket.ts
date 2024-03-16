import { z } from "zod";

import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "./AuthParams";

const AuthParamsSchema = z.object({
  nonce: z.string().optional(),
  state: z.string().optional(),
  scope: z.string().optional(),
  response_type: AuthorizationResponseType.optional(),
  response_mode: AuthorizationResponseMode.optional(),
  redirect_uri: z.string().url().optional(),
});

export const ticketSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  client_id: z.string(),
  email: z.string().email(),
  authParams: AuthParamsSchema.optional(),
  created_at: z.date(),
  expires_at: z.date(),
  used_at: z.date().optional(),
});

export interface Ticket {
  id: string;
  tenant_id: string;
  client_id: string;
  email: string;
  authParams?: {
    nonce?: string;
    state?: string;
    scope?: string;
    response_type?: AuthorizationResponseType;
    response_mode?: AuthorizationResponseMode;
    redirect_uri?: string;
  };
  created_at: Date;
  expires_at: Date;
  used_at?: Date;
}
