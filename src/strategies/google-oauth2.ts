import { generateCodeVerifier, Google } from "arctic";
import { Context } from "hono";
import { Connection } from "authhero";
import { nanoid } from "nanoid";
import { Env, Var } from "../types";
import { parseJWT } from "oslo/jwt";
import { idTokenSchema } from "../types/IdToken";

export async function getRedirect(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  connection: Connection,
) {
  const { options } = connection;

  if (!options?.client_id || !options.client_secret) {
    throw new Error("Missing required Google authentication parameters");
  }

  const google = new Google(
    options.client_id,
    options.client_secret,
    `${ctx.env.ISSUER}callback`,
  );

  const code = nanoid();
  const code_verifier = generateCodeVerifier();

  const authorizationUrl = google.createAuthorizationURL(
    code,
    code_verifier,
    options.scope?.split(" ") ?? ["email", "profile"],
  );

  return {
    redirectUrl: authorizationUrl.href,
    code,
    codeVerifier: code_verifier,
  };
}

export async function validateAuthorizationCodeAndGetUser(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  connection: Connection,
  code: string,
  code_verifier?: string,
) {
  const { options } = connection;

  if (!options?.client_id || !options.client_secret || !code_verifier) {
    throw new Error("Missing required authentication parameters");
  }

  const google = new Google(
    options.client_id,
    options.client_secret,
    `${ctx.env.ISSUER}callback`,
  );

  const tokens = await google.validateAuthorizationCode(code, code_verifier);
  const idToken = parseJWT(tokens.idToken());

  if (!idToken) {
    throw new Error("Invalid ID token");
  }

  const payload = idTokenSchema.parse(idToken.payload);

  return {
    sub: payload.sub,
    email: payload.email,
    given_name: payload.given_name,
    family_name: payload.family_name,
    name: payload.name,
    picture: payload.picture,
    locale: payload.locale,
  };
}