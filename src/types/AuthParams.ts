import { z } from "zod";

export enum AuthorizationResponseType {
  TOKEN = "token",
  TOKEN_ID_TOKEN = "token id_token",
  CODE = "code",
}

export enum AuthorizationResponseMode {
  QUERY = "query",
  FRAGMENT = "fragment",
  FORM_POST = "form_post",
  WEB_MESSAGE = "web_message",
}

export enum CodeChallengeMethod {
  S265 = "S256",
  plain = "plain",
}

export const authParamsSchema = z.object({
  nonce: z.string().optional(),
  state: z.string().optional(),
  scope: z.string().optional(),
  response_type: z.nativeEnum(AuthorizationResponseType).optional(),
  response_mode: z.nativeEnum(AuthorizationResponseMode).optional(),
  redirect_uri: z.string().url().optional(),
  audience: z.string().optional(),
  code_challenge_method: z.nativeEnum(CodeChallengeMethod).optional(),
  code_challenge: z.string().optional(),
  username: z.string().optional(),
  client_id: z.string().optional(),
});

export interface AuthParams {
  client_id?: string;
  response_type?: AuthorizationResponseType;
  response_mode?: AuthorizationResponseMode;
  redirect_uri?: string;
  audience?: string;
  state?: string;
  nonce?: string;
  scope?: string;
  code_challenge_method?: CodeChallengeMethod;
  code_challenge?: string;
  username?: string;
}
