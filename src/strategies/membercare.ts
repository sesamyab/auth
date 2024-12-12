import { OAuth2Client } from "arctic";
import { Context } from "hono";
import { Connection } from "authhero";
import { nanoid } from "nanoid";
import { Env, Var } from "../types";
import { parseJWT } from "oslo/jwt";
import { z } from "zod";

export async function getRedirect(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  connection: Connection,
) {
  const { options } = connection;

  if (
    !options?.client_id ||
    !options.client_secret ||
    !options.authorization_endpoint
  ) {
    throw new Error("Missing required authentication parameters");
  }

  const oauth2 = new OAuth2Client(
    options.client_id,
    options.client_secret,
    `${ctx.env.ISSUER}callback`,
  );

  const code = nanoid();

  const authorizationUrl = oauth2.createAuthorizationURL(
    options.authorization_endpoint,
    code,
    ["openid"],
  );

  authorizationUrl.searchParams.set("prompt", "login");

  return {
    redirectUrl: authorizationUrl.href,
    code,
  };
}

export async function validateAuthorizationCodeAndGetUser(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  connection: Connection,
  code: string,
) {
  const { options } = connection;

  if (
    !options?.client_id ||
    !options.client_secret ||
    !options.token_endpoint ||
    !options.userinfo_endpoint ||
    !options.app_secret
  ) {
    throw new Error("Missing required authentication parameters");
  }

  const oauth2 = new OAuth2Client(
    options.client_id,
    options.client_secret,
    `${ctx.env.ISSUER}callback`,
  );

  const tokens = await oauth2.validateAuthorizationCode(
    options.token_endpoint,
    code,
    null,
  );

  const accessToken = parseJWT(tokens.accessToken());

  if (
    !accessToken ||
    !("DebtorAccountNumber" in accessToken.payload) ||
    typeof accessToken.payload.DebtorAccountNumber !== "string"
  ) {
    throw new Error("Invalid access token");
  }

  // The email isn't available in the tokens so we need to make an additional request to the api to get it
  // First fetch a token from the userinfo endpoint
  const [clientApiKey, personToImpersonate] = options.app_secret.split("|");
  const tokenUrl = new URL(options.userinfo_endpoint);
  tokenUrl.pathname = "/api/v1/token";
  tokenUrl.searchParams.set("clientApiKey", clientApiKey);
  tokenUrl.searchParams.set("personToImpersonate", personToImpersonate);

  const tokenResponse = await fetch(tokenUrl.href, {
    cf: {
      // Add cache headers for cloudflare here
    },
  });
  if (!tokenResponse.ok) {
    throw new Error("Failed to fetch token");
  }

  const { value } = z
    .object({
      value: z.string(),
      expiration: z.string(),
    })
    .parse(await tokenResponse.json());

  const userInfoUrl = new URL(options.userinfo_endpoint);
  userInfoUrl.pathname = `/api/v1/debtors/${accessToken.payload.DebtorAccountNumber}`;
  const debtorResponse = await fetch(userInfoUrl.href, {
    headers: {
      token: value,
    },
    cf: {
      // Add cache headers for cloudflare here
    },
  });

  if (!debtorResponse.ok) {
    throw new Error("Failed to fetch user info");
  }

  const debtorBody = await debtorResponse.json();
  const debtor = z
    .object({
      firstname: z.string().optional(),
      lastname: z.string().optional(),
      email: z.string().optional(),
      debtorAccountNumber: z.string(),
    })
    .parse(debtorBody);

  return {
    id: debtor.debtorAccountNumber,
    email: debtor.email,
    given_name: debtor.firstname,
    family_name: debtor.lastname,
  };
}
