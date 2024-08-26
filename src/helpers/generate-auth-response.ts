import { Env, Var } from "../types";
import {
  ACCESS_TOKEN_EXPIRE_IN_SECONDS,
  UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS,
} from "../constants";
import { pemToBuffer } from "../utils/jwt";
import { createJWT } from "oslo/jwt";
import { TimeSpan } from "oslo";
import { serializeAuthCookie } from "../services/cookies";
import { applyTokenResponse } from "./apply-token-response";
import { nanoid } from "nanoid";
import { createLogMessage } from "../utils/create-log-message";
import { Context } from "hono";
import { waitUntil } from "../utils/wait-until";
import { postUserLoginWebhook } from "../hooks/webhooks";
import {
  AuthParams,
  AuthorizationResponseMode,
  AuthorizationResponseType,
  Client,
  CodeResponse,
  LogTypes,
  TokenResponse,
  User,
} from "@authhero/adapter-interfaces";
import { setSilentAuthCookies } from "./silent-auth-cookie";
import { SAMLResponse } from "./saml-response";
import { samlResponseForm } from "../templates/samlResponse";
import { HTTPException } from "hono/http-exception";

export type AuthFlowType =
  | "cross-origin"
  | "same-origin"
  | "refresh-token"
  | "code";

export interface GenerateAuthResponseParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  client: Client;
  // The user will be undefined if the client is a client_credentials grant
  user?: User;
  sid?: string;
  authParams: AuthParams;
  authFlow?: AuthFlowType;
}

function getLogTypeByAuthFlow(authFlow?: AuthFlowType) {
  switch (authFlow) {
    case "cross-origin":
      return LogTypes.SUCCESS_CROSS_ORIGIN_AUTHENTICATION;
    case "same-origin":
      return LogTypes.SUCCESS_LOGIN;
    case "refresh-token":
      return LogTypes.SUCCESS_EXCHANGE_REFRESH_TOKEN_FOR_ACCESS_TOKEN;
    case "code":
      return LogTypes.SUCCESS_EXCHANGE_AUTHORIZATION_CODE_FOR_ACCESS_TOKEN;
    default:
      return LogTypes.SUCCESS_LOGIN;
  }
}

async function generateCode({
  ctx,
  client,
  sid,
  authParams,
  user,
}: GenerateAuthResponseParams) {
  const { env } = ctx;

  if (!user) {
    throw new Error("User is required for generating a code");
  }

  const code_id = nanoid();

  let login_id = sid;

  if (!login_id) {
    // The code is connected to a login session
    const login = await ctx.env.data.logins.create(client.tenant.id, {
      expires_at: new Date(
        Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
      ).toISOString(),
      authParams,
    });

    login_id = login.login_id;
  }

  await env.data.codes.create(client.tenant.id, {
    login_id,
    expires_at: new Date(Date.now() + 30 * 1000).toISOString(),
    code_id,
    code_type: "authorization_code",
    user_id: user.user_id,
  });

  const codeResponse: CodeResponse = {
    code: code_id,
    state: authParams.state,
  };

  return codeResponse;
}

export async function generateTokens(params: GenerateAuthResponseParams) {
  const { ctx, client, authParams, user, sid, authFlow } = params;
  const { env } = ctx;

  if (authFlow !== "refresh-token" && user) {
    // Invoke webhooks
    await postUserLoginWebhook(ctx, env.data)(client.tenant.id, user);

    // Update the user's last login. Skip for client_credentials and refresh_tokens
    waitUntil(
      ctx,
      ctx.env.data.users.update(client.tenant.id, user.user_id, {
        last_login: new Date().toISOString(),
        login_count: user.login_count + 1,
        // This is specific to cloudflare
        last_ip: ctx.req.header("cf-connecting-ip"),
      }),
    );
  }

  const signingKeys = await env.data.keys.list();
  const signingKey = signingKeys[signingKeys.length - 1];

  // TODO: remove fallback
  // @ts-ignore
  const privatKey: string = signingKey.pkcs7 ?? signingKey.private_key;

  const keyBuffer = pemToBuffer(privatKey);

  const accessToken = await createJWT(
    "RS256",
    keyBuffer,
    {
      aud: authParams.audience || "default",
      scope: authParams.scope || "",
      sub: user?.user_id || client.id,
      iss: env.ISSUER,
      azp: client.tenant.id,
    },
    {
      includeIssuedTimestamp: true,
      expiresIn: new TimeSpan(1, "d"),
      headers: {
        kid: signingKey.kid,
      },
    },
  );

  const tokenResponse: TokenResponse = {
    access_token: accessToken,
    token_type: "Bearer",
    state: authParams.state,
    scope: authParams.scope,
    expires_in: ACCESS_TOKEN_EXPIRE_IN_SECONDS,
  };

  // ID TOKEN
  if (
    authParams.response_type === AuthorizationResponseType.TOKEN_ID_TOKEN &&
    user
  ) {
    tokenResponse.id_token = await createJWT(
      "RS256",
      keyBuffer,
      {
        // The audience for an id token is the client id
        aud: authParams.client_id,
        sub: user.user_id,
        iss: env.ISSUER,
        sid,
        nonce: authParams.nonce,
        given_name: user.given_name,
        family_name: user.family_name,
        nickname: user.nickname,
        picture: user.picture,
        locale: user.locale,
        name: user.name,
        email: user.email,
        email_verified: user.email_verified,
      },
      {
        includeIssuedTimestamp: true,
        expiresIn: new TimeSpan(1, "d"),
        headers: {
          kid: signingKey.kid,
        },
      },
    );
  }

  // REFRESH TOKEN
  // if (authParams.scope?.split(" ").includes("offline_access")) {
  //   const { refresh_token } = await createRefreshToken(params);
  //   tokenResponse.refresh_token = refresh_token;
  // }

  return tokenResponse;
}

export async function generateAuthData(params: GenerateAuthResponseParams) {
  const { ctx, client } = params;
  const log = createLogMessage(params.ctx, {
    type: getLogTypeByAuthFlow(params.authFlow),
    description: "Successful login",
  });
  waitUntil(ctx, ctx.env.data.logs.create(client.tenant.id, log));

  switch (params.authParams.response_type) {
    case AuthorizationResponseType.CODE:
      return generateCode(params);
    case AuthorizationResponseType.TOKEN:
    case AuthorizationResponseType.TOKEN_ID_TOKEN:
    default:
      return generateTokens(params);
  }
}

export async function generateAuthResponse(params: GenerateAuthResponseParams) {
  const { ctx, authParams, sid, client, user } = params;

  const tokens = await generateAuthData(params);

  const headers = new Headers();
  if (user) {
    const sessionId =
      sid ||
      (await setSilentAuthCookies(ctx.env, client.tenant.id, client.id, user));

    headers.set("set-cookie", serializeAuthCookie(client.tenant.id, sessionId));
  }

  if (authParams.response_mode === AuthorizationResponseMode.SAML_POST) {
    if (!authParams.redirect_uri) {
      throw new HTTPException(400, {
        message: "Missing redirect_uri in authParams",
      });
    }

    const samlResponse = new SAMLResponse({
      issuer: "https://keycloak.rejlers-srv01.se/auth/realms/master", // ctx.env.ISSUER,
      recipient: authParams.redirect_uri || "",
      audience: authParams.audience || "default",
      nameID: user?.user_id || "userId",
      userEmail: user?.email || "",
      inResponseTo: authParams.state,
    });

    const xmlResponse = samlResponse.generateResponse();
    const encodedResponse = samlResponse.encodeResponse(xmlResponse);

    return samlResponseForm(authParams.redirect_uri, encodedResponse);
  }

  if (authParams.response_mode === AuthorizationResponseMode.FORM_POST) {
    return ctx.json(tokens, { headers });
  }

  headers.set("location", applyTokenResponse(tokens, authParams));

  // TODO: should we have different response for different response modes?
  return new Response("Redirecting", {
    status: 302,
    headers,
  });
}
