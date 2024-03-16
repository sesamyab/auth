import { z } from "zod";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "./AuthParams";

export const otpSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  client_id: z.string(),
  email: z.string(),
  code: z.string(),
  send: z.enum(["link", "code"]),
  authParams: z.object({
    nonce: z.string().optional(),
    state: z.string().optional(),
    scope: z.string().optional(),
    response_type: z.nativeEnum(AuthorizationResponseType).optional(),
    response_mode: z.nativeEnum(AuthorizationResponseMode).optional(),
    redirect_uri: z.string().optional(),
  }),
  created_at: z.date(),
  expires_at: z.date(),
  used_at: z.string().optional(),
  user_id: z.string().optional(),
});

export interface OTP {
  id: string;
  tenant_id: string;
  client_id: string;
  email: string;
  code: string;
  send: "link" | "code";
  authParams: {
    nonce?: string;
    state?: string;
    scope?: string;
    response_type?: AuthorizationResponseType;
    response_mode?: AuthorizationResponseMode;
    redirect_uri?: string;
  };
  created_at: Date;
  expires_at: Date;
  used_at?: string;
  user_id?: string;
}
