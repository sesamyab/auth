import { z } from "zod";

// TypeScript enum is directly used in Zod
export enum GrantType {
  RefreshToken = "refresh_token",
  AuthorizationCode = "authorization_code",
  ClientCredential = "client_credentials",
  Passwordless = "passwordless",
  Password = "password",
}

export const grantType = z.nativeEnum(GrantType);

// Interface schemas
export const refreshTokenGrantTypeParams = z.object({
  grant_type: z.literal(GrantType.RefreshToken),
  refresh_token: z.string(),
  client_id: z.string(),
});

export const authorizationCodeGrantTypeParams = z.object({
  grant_type: z.literal(GrantType.AuthorizationCode),
  code: z.string(),
  client_secret: z.string(),
  client_id: z.string(),
});

export const pkceAuthorizationCodeGrantTypeParams = z.object({
  grant_type: z.literal(GrantType.AuthorizationCode),
  code: z.string(),
  code_verifier: z.string(),
  client_id: z.string().optional(),
  redirect_uri: z.string(),
});

export const clientCredentialGrantTypeParams = z.object({
  grant_type: z.literal(GrantType.ClientCredential),
  scope: z.string().optional(),
  client_secret: z.string(),
  client_id: z.string(),
  audience: z.string().optional(),
});

export const passwordGrantTypeParams = z.object({
  grant_type: z.literal(GrantType.Password),
  username: z.string(),
  password: z.string(),
  client_id: z.string(),
  audience: z.string().optional(),
  scope: z.string().optional(),
});

// Union of all grant type params
export const tokenParamsUnion = z.union([
  refreshTokenGrantTypeParams,
  authorizationCodeGrantTypeParams,
  pkceAuthorizationCodeGrantTypeParams,
  clientCredentialGrantTypeParams,
  passwordGrantTypeParams,
]);

// Partial of all grant type params for open api
export const tokenParams = refreshTokenGrantTypeParams
  .extend(authorizationCodeGrantTypeParams.shape)
  .extend(pkceAuthorizationCodeGrantTypeParams.shape)
  .extend(clientCredentialGrantTypeParams.shape)
  .extend(passwordGrantTypeParams.shape)
  .partial();

// TokenResponse and CodeResponse schemas
export const tokenResponse = z.object({
  access_token: z.string(),
  id_token: z.string().optional(),
  scope: z.string().optional(),
  state: z.string().optional(),
  refresh_token: z.string().optional(),
  token_type: z.string(),
  expires_in: z.number(),
});

export const codeResponse = z.object({
  code: z.string(),
  state: z.string().optional(),
});

// Exporting inferred types
export type RefreshTokenGrantTypeParams = z.infer<
  typeof refreshTokenGrantTypeParams
>;
export type AuthorizationCodeGrantTypeParams = z.infer<
  typeof authorizationCodeGrantTypeParams
>;
export type PKCEAuthorizationCodeGrantTypeParams = z.infer<
  typeof pkceAuthorizationCodeGrantTypeParams
>;
export type ClientCredentialGrantTypeParams = z.infer<
  typeof clientCredentialGrantTypeParams
>;
export type PasswordGrantTypeParams = z.infer<typeof passwordGrantTypeParams>;
export type TokenParams = z.infer<typeof tokenParams>;
export type TokenResponse = z.infer<typeof tokenResponse>;
export type CodeResponse = z.infer<typeof codeResponse>;
