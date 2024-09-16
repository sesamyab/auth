import { Context } from "hono";
import { Apple } from "arctic";
import {
  AuthParams,
  Client,
  LogTypes,
  Login,
} from "@authhero/adapter-interfaces";
import { Env } from "../types";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { parseJwt } from "../utils/parse-jwt";
import { validateRedirectUrl } from "../utils/validate-redirect-url";
import { Var } from "../types/Var";
import { HTTPException } from "hono/http-exception";
import { getClient } from "../services/clients";
import { getPrimaryUserByEmailAndProvider } from "../utils/users";
import UserNotFound from "../components/UserNotFoundPage";
import { fetchVendorSettings } from "../utils/fetchVendorSettings";
import { createLogMessage } from "../utils/create-log-message";
import { setSearchParams } from "../utils/url";
import i18next from "i18next";
import { preUserSignupHook } from "../hooks";
import {
  OAUTH2_CODE_EXPIRES_IN_SECONDS,
  UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS,
} from "../constants";
import { nanoid } from "nanoid";

export async function socialAuth(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  client: Client,
  connectionName: string,
  authParams: AuthParams,
  auth0Client?: string,
) {
  if (!authParams.state) {
    throw new HTTPException(400, { message: "State not found" });
  }

  console.log("connection", client.connections);
  console.log("connectionName", connectionName);

  const connection = client.connections.find((p) => p.name === connectionName);

  console.log("connection", connection);

  if (!connection) {
    ctx.set("client_id", client.id);
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN,
      description: "Connection not found",
    });
    await ctx.env.data.logs.create(client.tenant.id, log);

    throw new HTTPException(403, { message: "Connection Not Found" });
  }

  let session = await ctx.env.data.logins.get(
    client.tenant.id,
    authParams.state,
  );

  if (!session) {
    session = await ctx.env.data.logins.create(client.tenant.id, {
      expires_at: new Date(
        Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
      ).toISOString(),
      authParams,
      auth0Client,
    });
  }

  const auth2State = await ctx.env.data.codes.create(client.tenant.id, {
    login_id: session.login_id,
    code_id: nanoid(),
    code_type: "oauth2_state",
    connection_id: connection.id,
    expires_at: new Date(
      Date.now() + OAUTH2_CODE_EXPIRES_IN_SECONDS * 1000,
    ).toISOString(),
  });

  if (connectionName === "apple") {
    const apple = new Apple(
      {
        clientId: connection.options!.client_id!,
        teamId: connection.options!.team_id!,
        keyId: connection.options!.kid!,
        certificate: connection
          .options!.app_secret!.replace(/^-----BEGIN PRIVATE KEY-----/, "")
          .replace(/-----END PRIVATE KEY-----/, "")
          .replace(/\s/g, ""),
      },
      `${ctx.env.ISSUER}callback`,
    );

    const appleAuthorizatioUrl = await apple.createAuthorizationURL(
      auth2State.code_id,
    );

    return ctx.redirect(appleAuthorizatioUrl.href);
  }

  const oauthLoginUrl = new URL(connection.options!.authorization_endpoint!);

  setSearchParams(oauthLoginUrl, {
    scope: connection.options!.scope,
    client_id: connection.options!.client_id,
    redirect_uri: `${ctx.env.ISSUER}callback`,
    response_type: connection.response_type,
    response_mode: connection.response_mode,
    state: auth2State.code_id,
  });

  return ctx.redirect(oauthLoginUrl.href);
}

interface socialAuthCallbackParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  session: Login;
  code: string;
  connection_id: string;
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

export async function oauth2Callback({
  ctx,
  session,
  code,
  connection_id,
}: socialAuthCallbackParams) {
  const { env } = ctx;
  const client = await getClient(env, session.authParams.client_id);
  ctx.set("client_id", client.id);
  ctx.set("tenant_id", client.tenant.id);

  const connection = client.connections.find((p) => p.id === connection_id);

  if (!connection) {
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN,
      description: "Connection not found",
    });
    await ctx.env.data.logs.create(client.tenant.id, log);
    throw new HTTPException(403, { message: "Connection not found" });
  }
  ctx.set("connection", connection.name);
  ctx.set("connection_id", connection.id);
  ctx.set("strategy", connection.name);
  ctx.set("strategy_type", "social");

  if (!session.authParams.redirect_uri) {
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN,
      description: "Redirect URI not defined",
    });
    await ctx.env.data.logs.create(client.tenant.id, log);
    throw new HTTPException(403, { message: "Redirect URI not defined" });
  }

  if (
    !validateRedirectUrl(
      client.callbacks || [],
      session.authParams.redirect_uri,
    )
  ) {
    const invalidRedirectUriMessage = `Invalid redirect URI - ${session.authParams.redirect_uri}`;
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN,
      description: invalidRedirectUriMessage,
    });
    await ctx.env.data.logs.create(client.tenant.id, log);
    throw new HTTPException(403, {
      message: invalidRedirectUriMessage,
    });
  }

  let userinfo: any;
  if (connection.name === "apple") {
    const apple = new Apple(
      {
        clientId: connection.options!.client_id!,
        teamId: connection.options!.team_id!,
        keyId: connection.options!.kid!,
        certificate: connection
          .options!.app_secret!.replace(/^-----BEGIN PRIVATE KEY-----/, "")
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
        client_id: connection.options!.client_id!,
        authorization_endpoint: connection.options!.authorization_endpoint!,
        token_endpoint: connection.options!.token_endpoint!,
        scope: connection.options!.scope!,
      },
      `${env.ISSUER}callback`,
    );

    const token = await oauth2Client.exchangeCodeForTokenResponse(code, true);

    if (connection.options!.userinfo_endpoint) {
      userinfo = getProfileData(
        await oauth2Client.getUserProfile(token.access_token),
      );
    } else if (token.id_token) {
      userinfo = getProfileData(parseJwt(token.id_token));
    } else {
      throw new HTTPException(500, {
        message: "No id_token or userinfo endpoint available",
      });
    }
  }

  const { sub, email, ...profileData } = userinfo;
  ctx.set("userId", sub);

  let lowerCaseEmail =
    email?.toLocaleLowerCase() ||
    `${connection.name}.${sub}@${new URL(ctx.env.ISSUER).hostname}`;

  ctx.set("userName", email);
  const strictEmailVerified = !!profileData.email_verified;

  let user = await getPrimaryUserByEmailAndProvider({
    userAdapter: env.data.users,
    tenant_id: client.tenant.id,
    email: lowerCaseEmail,
    provider: connection.name,
  });

  if (user) {
    ctx.set("userId", user.user_id);
  } else {
    try {
      await preUserSignupHook(ctx, client, ctx.env.data, email);
    } catch (err: any) {
      console.log("error", err.message);
      const vendorSettings = await fetchVendorSettings(
        env,
        client.id,
        session.authParams.vendor_id,
      );

      await i18next.changeLanguage(client.tenant.language || "sv");

      return ctx.html(
        <UserNotFound
          vendorSettings={vendorSettings}
          authParams={session.authParams}
        />,
        400,
      );
    }

    user = await env.data.users.create(client.tenant.id, {
      user_id: `${connection.name}|${sub}`,
      email: lowerCaseEmail,
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
    ctx.set("userId", user.user_id);
  }

  return generateAuthResponse({
    ctx,
    client,
    authParams: session.authParams,
    user,
  });
}
