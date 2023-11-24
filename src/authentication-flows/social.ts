import { Controller } from "@tsoa/runtime";
import { Context } from "hono";
import {
  AuthorizationResponseType,
  AuthParams,
  Client,
  Env,
  LoginState,
} from "../types";
import { headers } from "../constants";
import { hexToBase64 } from "../utils/base64";
import { getClient } from "../services/clients";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { parseJwt } from "../utils/parse-jwt";
import { applyTokenResponse } from "../helpers/apply-token-response";
import { InvalidConnectionError } from "../errors";
import { validateRedirectUrl } from "../utils/validate-redirect-url";
import { Var } from "../types/Var";
import { HTTPException } from "hono/http-exception";

export interface SocialAuthState {
  authParams: AuthParams;
  connection: string;
}

export async function socialAuth(
  env: Env,
  controller: Controller,
  client: Client,
  connection: string,
  authParams: AuthParams,
) {
  const connectionInstance = client.connections.find(
    (p) => p.name === connection,
  );
  if (!connectionInstance) {
    throw new InvalidConnectionError("Connection not found");
  }

  const stateId = env.STATE.newUniqueId().toString();
  const stateInstance = env.stateFactory.getInstanceById(stateId);
  await stateInstance.createState.mutate({
    state: JSON.stringify({ authParams, connection }),
  });

  const oauthLoginUrl = new URL(connectionInstance.authorization_endpoint);
  if (connectionInstance.scope) {
    oauthLoginUrl.searchParams.set("scope", connectionInstance.scope);
  }
  oauthLoginUrl.searchParams.set("state", hexToBase64(stateId));
  oauthLoginUrl.searchParams.set("redirect_uri", `${env.ISSUER}callback`);
  oauthLoginUrl.searchParams.set("client_id", connectionInstance.client_id);
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
  controller.setHeader(headers.location, oauthLoginUrl.href);
  controller.setStatus(302);
  return `Redirecting to ${connection}`;
}

export interface socialAuthCallbackParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  controller: Controller;
  state: LoginState;
  code: string;
}

export async function socialAuthCallback({
  ctx,
  controller,
  state,
  code,
}: socialAuthCallbackParams) {
  const { env } = ctx;
  const client = await getClient(env, state.authParams.client_id);
  const connection = client.connections.find(
    (p) => p.name === state.connection,
  );

  if (!connection) {
    throw new HTTPException(403, { message: "Connection not found" });
  }

  if (!state.authParams.redirect_uri) {
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

  const oauth2Client = env.oauth2ClientFactory.create(
    connection,
    `${env.ISSUER}callback`,
  );

  const token = await oauth2Client.exchangeCodeForTokenResponse(code);

  const idToken = parseJwt(token.id_token!);

  const {
    iss,
    azp,
    aud,
    at_hash,
    iat,
    exp,
    sub,
    hd,
    jti,
    nonce,
    ...profileData
  } = idToken;

  const email = idToken.email.toLocaleLowerCase();

  // this is an interesting change! We're assuming now that all SSO accounts are stored with the id as the SSO sub
  // BUT we already have existing users... so do we need something defensive here?
  // e.g. get by email AND if have same provider? e.g. this SSO provider, then we change the id? TBD with Markus
  // TODO - make another ticket if so
  let user = await env.data.users.get(client.tenant_id, sub);

  if (!state.connection) {
    throw new HTTPException(403, { message: "Connection not found" });
  }

  if (!user) {
    const existingEmailUser = await env.data.users.getByEmail(
      client.tenant_id,
      email,
    );

    // this code is all hacky and imperative... once everything merged would be great to add tests and rewrite using functions
    let mainUserProfileId: string | undefined = undefined;

    if (existingEmailUser) {
      // this is a backwards compatible fix... hmmmm... can we just nuke all existing SSO accounts? seeing as Auth0 is the source of truth?
      if (existingEmailUser.provider === state.connection) {
        // we should just update this user!
        // await env.data.users.update(client.tenant_id, existingEmailUser.id, {
        // so we cannot actually update the id... according to these types... TBD
        // id: sub,
        // });
        // no delete... should we have one?
        // await env.data.users.delete(client.tenant_id, existingEmailUser.id);
      } else {
        // wahey! now we do the linking!
        mainUserProfileId = existingEmailUser.id;
      }
    }

    user = await env.data.users.create(client.tenant_id, {
      email,
      tenant_id: client.tenant_id,
      id: sub,
      name: email,
      provider: state.connection,
      connection: state.connection,
      email_verified: false,
      last_ip: "",
      login_count: 0,
      is_social: false,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      linked_to: mainUserProfileId, // "Main"? what should the correct terminology be here?
    });
  }

  ctx.set("email", email);
  ctx.set("userId", user.id);

  // once everything merged we could combine these so not so many writes... but functionality is the most important
  await env.data.users.update(client.tenant_id, ctx.get("userId"), {
    profileData: JSON.stringify(profileData),
  });

  await env.data.logs.create({
    category: "login",
    message: `Login with ${connection.name}`,
    tenant_id: client.tenant_id,
    user_id: user.id,
  });

  const sessionId = await setSilentAuthCookies(
    env,
    controller,
    client.tenant_id,
    client.id,
    user,
  );

  const tokenResponse = await generateAuthResponse({
    env,
    userId: user.id,
    sid: sessionId,
    state: state.authParams.state,
    nonce: state.authParams.nonce,
    authParams: state.authParams,
    user,
    responseType:
      state.authParams.response_type || AuthorizationResponseType.TOKEN,
  });

  return applyTokenResponse(controller, tokenResponse, state.authParams);
}
