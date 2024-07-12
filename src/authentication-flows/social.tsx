import { Context } from "hono";
import { Apple, Facebook, Google, generateCodeVerifier } from "arctic";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { AuthParams, Client, Env, LoginState } from "../types";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie-new";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { parseJwt } from "../utils/parse-jwt";
import { validateRedirectUrl } from "../utils/validate-redirect-url";
import { Var } from "../types/Var";
import { HTTPException } from "hono/http-exception";
import { stateEncode } from "../utils/stateEncode";
import { getClient } from "../services/clients";
import { LogTypes } from "../types";
import { getPrimaryUserByEmailAndProvider } from "../utils/users";
import UserNotFound from "../components/UserNotFoundPage";
import { fetchVendorSettings } from "../utils/fetchVendorSettings";
import { createLogMessage } from "../utils/create-log-message";
import { Vipps } from "./oauth2-adapters/vipps";

export async function socialAuth(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  client: Client,
  connectionName: string,
  authParams: AuthParams,
) {
  const { env } = ctx;

  const connection = client.connections.find((p) => p.name === connectionName);
  if (!connection) {
    ctx.set("client_id", client.id);
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN,
      description: "Connection not found",
    });
    await ctx.env.data.logs.create(client.tenant_id, log);

    throw new HTTPException(403, { message: "Connection Not Found" });
  }

  const state = stateEncode({ authParams, connection: connectionName });

  let url: URL;

  switch (connection.name) {
    case "google-oauth2":
      const google = new Google(
        connection.client_id!,
        connection.client_secret!,
        `${env.ISSUER}callback`,
      );
      const codeVerifyer = generateCodeVerifier();
      setCookie(ctx, "code_verifyer", codeVerifyer, {
        httpOnly: true,
        maxAge: 300,
      });
      url = await google.createAuthorizationURL(state, codeVerifyer, {
        scopes: ["profile", "email"],
      });
      break;
    case "apple":
      const apple = new Apple(
        {
          clientId: connection.client_id!,
          teamId: connection.team_id!,
          keyId: connection.kid!,
          certificate: connection
            .private_key!.replace(/^-----BEGIN PRIVATE KEY-----/, "")
            .replace(/-----END PRIVATE KEY-----/, "")
            .replace(/\s/g, ""),
        },
        `${env.ISSUER}callback`,
      );

      url = await apple.createAuthorizationURL(state, {
        scopes: ["name", "email"],
      });
    case "facebook":
      const facebook = new Facebook(
        connection.client_id!,
        connection.client_secret!,
        `${env.ISSUER}callback`,
      );

      url = await facebook.createAuthorizationURL(state, {
        scopes: ["email"],
      });
    case "vipps":
      const vipps = new Vipps(
        connection.client_id!,
        connection.client_secret!,
        `${env.ISSUER}callback`,
      );

      url = await vipps.createAuthorizationURL(state, {
        scopes: ["email", "phoneNumber", "name", "address", "birthDate"],
      });
      break;
    default:
      throw new HTTPException(400, {
        message: "Strategy not supported",
      });
  }

  return ctx.redirect(url.href);
}

interface socialAuthCallbackParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  state: LoginState;
  code: string;
}

export async function socialAuthCallback({
  ctx,
  state,
  code,
}: socialAuthCallbackParams) {
  const { env } = ctx;
  ctx.set("client_id", state.authParams.client_id);
  const client = await getClient(env, state.authParams.client_id);

  const connection = client.connections.find(
    (p) => p.name === state.connection,
  );

  if (!connection) {
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN,
      description: "Connection not found",
    });
    await ctx.env.data.logs.create(client.tenant_id, log);
    throw new HTTPException(403, { message: "Connection not found" });
  }
  ctx.set("connection", connection.name);

  if (!state.authParams.redirect_uri) {
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN,
      description: "Redirect URI not defined",
    });
    await ctx.env.data.logs.create(client.tenant_id, log);
    throw new HTTPException(403, { message: "Redirect URI not defined" });
  }

  if (
    !validateRedirectUrl(
      client.allowed_callback_urls,
      state.authParams.redirect_uri,
    )
  ) {
    throw new HTTPException(403, {
      message: `Invalid redirect URI - ${state.authParams.redirect_uri}`,
    });
  }

  const code_verifyer = getCookie(ctx, "code_verifyer");

  let userinfo: any;

  switch (connection.name) {
    case "apple":
      const apple = new Apple(
        {
          clientId: connection.client_id!,
          teamId: connection.team_id!,
          keyId: connection.kid!,
          certificate: connection
            .private_key!.replace(/^-----BEGIN PRIVATE KEY-----/, "")
            .replace(/-----END PRIVATE KEY-----/, "")
            .replace(/\s/g, ""),
        },
        `${env.ISSUER}callback`,
      );

      const appleTokens = await apple.validateAuthorizationCode(code);
      userinfo = parseJwt(appleTokens.idToken);
      break;
    case "google-oauth2":
      if (!code_verifyer) {
        throw new HTTPException(400, {
          message: "Code verifier not found",
        });
      }

      const google = new Google(
        connection.client_id!,
        connection.client_secret!,
        `${env.ISSUER}callback`,
      );

      const googleTokens = await google.validateAuthorizationCode(
        code,
        code_verifyer,
      );
      userinfo = parseJwt(googleTokens.idToken);
    case "facebook":
      const facebook = new Facebook(
        connection.client_id!,
        connection.client_secret!,
        `${env.ISSUER}callback`,
      );

      const facebookTokens = await facebook.validateAuthorizationCode(code);
      const facebookUserinfoUrl = new URL("https://graph.facebook.com/me");
      facebookUserinfoUrl.searchParams.set(
        "access_token",
        facebookTokens.accessToken,
      );
      facebookUserinfoUrl.searchParams.set(
        "fields",
        ["id", "name", "picture", "email"].join(","),
      );
      const facebookResponse = await fetch(facebookUserinfoUrl);
      if (!facebookResponse.ok) {
        throw new HTTPException(400, {
          message: "Failed to fetch user profile",
        });
      }
      userinfo = facebookResponse.json();
    case "vipps":
      const vipps = new Vipps(
        connection.client_id!,
        connection.client_secret!,
        `${env.ISSUER}callback`,
      );

      const vippsTokens = await vipps.validateAuthorizationCode(code);
      const vippsUserinfoUrl = new URL("https://graph.facebook.com/me");
      vippsUserinfoUrl.searchParams.set(
        "access_token",
        vippsTokens.accessToken,
      );
      vippsUserinfoUrl.searchParams.set(
        "fields",
        ["id", "name", "picture", "email"].join(","),
      );
      const vippsResponse = await fetch(vippsUserinfoUrl);
      if (!vippsResponse.ok) {
        throw new HTTPException(400, {
          message: "Failed to fetch user profile",
        });
      }
      userinfo = vippsResponse.json();
      break;
    default:
      throw new HTTPException(400, {
        message: "Strategy not supported",
      });
  }

  const { sub, email: emailRaw, ...profileData } = userinfo;

  const email = emailRaw.toLocaleLowerCase();
  ctx.set("userName", email);
  const strictEmailVerified = !!profileData.email_verified;

  let user = await getPrimaryUserByEmailAndProvider({
    userAdapter: env.data.users,
    tenant_id: client.tenant_id,
    email,
    provider: connection.name,
  });

  if (user) {
    ctx.set("userId", user.id);
  } else {
    const callerIsLogin2 = state.authParams.redirect_uri.includes("login2");

    if (client.disable_sign_ups && !callerIsLogin2) {
      const log = createLogMessage(ctx, {
        type: LogTypes.FAILED_SIGNUP,
        description: "Public signup is disabled",
      });
      await ctx.env.data.logs.create(client.tenant_id, log);

      const vendorSettings = await fetchVendorSettings(
        env,
        client.id,
        state.authParams.vendor_id,
      );

      return ctx.html(
        <UserNotFound
          vendorSettings={vendorSettings}
          authParams={state.authParams}
        />,
        400,
      );
    }

    user = await env.data.users.create(client.tenant_id, {
      id: `${state.connection}|${sub}`,
      email,
      name: email,
      provider: connection.name,
      connection: connection.name,
      email_verified: strictEmailVerified,
      last_ip: "",
      login_count: 0,
      is_social: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profileData: JSON.stringify(profileData),
    });
    ctx.set("userId", user.id);

    const log = createLogMessage(ctx, {
      type: LogTypes.SUCCESS_SIGNUP,
      description: "Successful signup",
    });
    await ctx.env.data.logs.create(client.tenant_id, log);
  }

  deleteCookie(ctx, "code_verifyer");

  const sessionId = await setSilentAuthCookies(
    env,
    client.tenant_id,
    client.id,
    user,
  );

  return generateAuthResponse({
    ctx,
    tenantId: client.tenant_id,
    sid: sessionId,
    state: state.authParams.state,
    nonce: state.authParams.nonce,
    authParams: state.authParams,
    user,
  });
}
