import { OAuth2Client } from "arctic";
import { Context } from "hono";
import { Connection } from "authhero";
import { nanoid } from "nanoid";
import { Env, Var } from "../types";
import { z } from "zod";
import { base64url } from "oslo/encoding";

function getJWTParts(
  jwt: string,
): [header: string, payload: string, signature: string] | null {
  const jwtParts = jwt.split(".");
  if (jwtParts.length !== 3) {
    return null;
  }
  return jwtParts as [string, string, string];
}

function parseJWT(jwt: string) {
  const jwtParts = getJWTParts(jwt);
  if (!jwtParts) {
    return null;
  }
  const textDecoder = new TextDecoder();
  const rawHeader = base64url.decode(jwtParts[0], {
    strict: false,
  });
  const rawPayload = base64url.decode(jwtParts[1], {
    strict: false,
  });
  const header: unknown = JSON.parse(textDecoder.decode(rawHeader));
  if (typeof header !== "object" || header === null) {
    return null;
  }
  const payload: unknown = JSON.parse(textDecoder.decode(rawPayload));
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const properties: {
    [key: string]: string | Date | null | string[] | number;
  } = {
    algorithm:
      "alg" in header && typeof header.alg === "string" ? header.alg : null,
    expiresAt: null,
    subject: null,
    issuedAt: null,
    issuer: null,
    jwtId: null,
    audiences: null,
    notBefore: null,
  };
  if ("exp" in payload) {
    if (typeof payload.exp !== "number") {
      return null;
    }
    properties.expiresAt = new Date(payload.exp * 1000);
  }
  if ("iss" in payload) {
    if (typeof payload.iss !== "string") {
      return null;
    }
    properties.issuer = payload.iss;
  }
  if ("sub" in payload) {
    if (typeof payload.sub !== "string") {
      return null;
    }
    properties.subject = payload.sub;
  }
  if ("aud" in payload) {
    if (!Array.isArray(payload.aud)) {
      if (typeof payload.aud !== "string") {
        return null;
      }
      properties.audiences = [payload.aud];
    } else {
      for (const item of payload.aud) {
        if (typeof item !== "string") {
          return null;
        }
      }
      properties.audiences = payload.aud;
    }
  }
  if ("nbf" in payload) {
    if (typeof payload.nbf !== "number") {
      return null;
    }
    properties.notBefore = new Date(payload.nbf * 1000);
  }
  if ("iat" in payload) {
    if (typeof payload.iat !== "number") {
      return null;
    }
    properties.issuedAt = new Date(payload.iat * 1000);
  }
  if ("jti" in payload) {
    if (typeof payload.jti !== "string") {
      return null;
    }
    properties.jwtId = payload.jti;
  }

  return {
    value: jwt,
    header: {
      ...header,
      typ: "JWT",
      alg: properties.alg,
    },
    payload: {
      ...payload,
    },
    parts: jwtParts,
    ...properties,
  };
}

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

  ctx.set("log", JSON.stringify(accessToken));

  if (
    !accessToken ||
    !("sub" in accessToken.payload) ||
    typeof accessToken.payload.sub !== "string"
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
  userInfoUrl.pathname = `/api/v1/persons/${accessToken.payload.sub}`;
  const debtorResponse = await fetch(userInfoUrl.href, {
    headers: {
      token: value,
    },
    cf: {
      // Add cache headers for cloudflare here
    },
  });

  if (!debtorResponse.ok) {
    throw new Error(
      "Failed to fetch user info: " + userInfoUrl.href + " " + value,
    );
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
