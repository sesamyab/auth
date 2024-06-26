import { Context } from "hono";
import { Apple } from "arctic";
import {
  AuthorizationResponseType,
  AuthParams,
  Client,
  Env,
  LoginState,
} from "../types";
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
import { createTypeLog } from "../tsoa-middlewares/logger";

export async function socialAuth(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  client: Client,
  connection: string,
  authParams: AuthParams,
) {
  const connectionInstance = client.connections.find(
    (p) => p.name === connection,
  );
  if (!connectionInstance) {
    ctx.set("client_id", client.id);
    const log = createTypeLog(
      LogTypes.FAILED_LOGIN,
      ctx,
      {},
      "Connection not found",
    );
    await ctx.env.data.logs.create(client.tenant_id, log);

    throw new HTTPException(403, { message: "Connection Not Found" });
  }

  const state = stateEncode({ authParams, connection });

  const oauthLoginUrl = new URL(connectionInstance.authorization_endpoint!);
  if (connectionInstance.scope) {
    oauthLoginUrl.searchParams.set("scope", connectionInstance.scope);
  }
  oauthLoginUrl.searchParams.set("state", state);
  oauthLoginUrl.searchParams.set("redirect_uri", `${ctx.env.ISSUER}callback`);
  oauthLoginUrl.searchParams.set("client_id", connectionInstance.client_id!);
  if (connectionInstance.response_type) {
    oauthLoginUrl.searchParams.set(
      "response_type",
      connectionInstance.response_type,
    );
  }
  if (connectionInstance.response_mode) {
    oauthLoginUrl.searchParams.set(
      "response_mode",
      connectionInstance.response_mode,
    );
  }

  return ctx.redirect(oauthLoginUrl.href);
}

interface socialAuthCallbackParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  state: LoginState;
  code: string;
}

function getProfileData(profile: any) {
  const {
    iss,
    azp,
    aud,
    at_hash,
    iat,
    exp,
    hd,
    jti,
    nonce,
    auth_time,
    nonce_supported,
    ...profileData
  } = profile;

  return profileData;
}

export async function socialAuthCallback({
  ctx,
  state,
  code,
}: socialAuthCallbackParams) {
  const { env } = ctx;
  const client = await getClient(env, state.authParams.client_id);

  if (!client) {
    ctx.set("client_id", state.authParams.client_id);
    const log = createTypeLog(
      LogTypes.FAILED_SIGNUP,
      ctx,
      {},
      "Client not found",
    );
    // where should we log this? if client not found then there's no tenant_id...
    await ctx.env.data.logs.create("DEFAULT_TENANT", log);
    throw new HTTPException(403, { message: "Client not found" });
  }
  const connection = client.connections.find(
    (p) => p.name === state.connection,
  );

  if (!connection) {
    ctx.set("client_id", client.id);
    const log = createTypeLog(
      LogTypes.FAILED_LOGIN,
      ctx,
      {},
      "Connection not found",
    );
    await ctx.env.data.logs.create(client.tenant_id, log);
    throw new HTTPException(403, { message: "Connection not found" });
  }

  if (!state.authParams.redirect_uri) {
    ctx.set("client_id", client.id);
    const log = createTypeLog(
      LogTypes.FAILED_LOGIN,
      ctx,
      {},
      "Redirect URI not defined",
    );
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

  let userinfo: any;
  if (connection.name === "apple") {
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

    const tokens = await apple.validateAuthorizationCode(code);
    userinfo = parseJwt(tokens.idToken);
  } else {
    const oauth2Client = env.oauth2ClientFactory.create(
      {
        // TODO: The types here are optional which isn't correct..
        ...connection,
        client_id: connection.client_id!,
        authorization_endpoint: connection.authorization_endpoint!,
        token_endpoint: connection.token_endpoint!,
        scope: connection.scope!,
      },
      `${env.ISSUER}callback`,
    );

    const token = await oauth2Client.exchangeCodeForTokenResponse(
      code,
      connection.token_exchange_basic_auth,
    );

    if (connection.userinfo_endpoint) {
      userinfo = getProfileData(
        await oauth2Client.getUserProfile(token.access_token),
      );
    } else if (token.id_token) {
      userinfo = getProfileData(parseJwt(token.id_token));
    } else {
      throw new HTTPException(500, {
        message: "No id_token or userinfo endpoint availeble",
      });
    }
  }

  const { sub, email: emailRaw, ...profileData } = userinfo;

  const email = emailRaw.toLocaleLowerCase();
  const strictEmailVerified = !!profileData.email_verified;

  let user = await getPrimaryUserByEmailAndProvider({
    userAdapter: env.data.users,
    tenant_id: client.tenant_id,
    email,
    provider: connection.name,
  });

  if (!user) {
    const callerIsLogin2 = state.authParams.redirect_uri.includes("login2");

    if (client.disable_sign_ups && !callerIsLogin2) {
      ctx.set("userName", email);
      ctx.set("client_id", client.id);
      ctx.set("connection", connection.name);
      const log = createTypeLog(
        LogTypes.FAILED_SIGNUP,
        ctx,
        {},
        "Public signup is disabled",
      );
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

    ctx.set("userName", user.email);
    ctx.set("connection", user.connection);
    ctx.set("client_id", client.id);
    ctx.set("userId", user.id);
    const log = createTypeLog("ss", ctx, "Successful signup");
    await ctx.env.data.logs.create(client.tenant_id, log);
  }

  const sessionId = await setSilentAuthCookies(
    env,
    client.tenant_id,
    client.id,
    user,
  );

  const authResponse = generateAuthResponse({
    env,
    tenantId: client.tenant_id,
    userId: user.id,
    sid: sessionId,
    state: state.authParams.state,
    nonce: state.authParams.nonce,
    authParams: state.authParams,
    user,
    responseType:
      state.authParams.response_type || AuthorizationResponseType.TOKEN,
  });

  ctx.set("userName", user.email);
  ctx.set("connection", user.connection);
  ctx.set("client_id", client.id);
  ctx.set("userId", user.id);
  const log = createTypeLog("s", ctx, "Successful login");
  await ctx.env.data.logs.create(client.tenant_id, log);

  return authResponse;
}
