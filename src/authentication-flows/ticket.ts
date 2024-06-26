import { Env, AuthParams, AuthorizationResponseType } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie-new";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { Var } from "../types/Var";
import { LogTypes } from "../types";
import { getPrimaryUserByEmailAndProvider } from "../utils/users";
import { sendEmailVerificationEmail } from "./passwordless";
import { getClient } from "../services/clients";
import { createTypeLog } from "../tsoa-middlewares/logger";
import { waitUntil } from "../utils/wait-until";

function getProviderFromRealm(realm: string) {
  if (realm === "Username-Password-Authentication") {
    return "auth2";
  }

  if (realm === "email") {
    return "email";
  }

  throw new HTTPException(403, { message: "Invalid realm" });
}

export async function ticketAuth(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  tenant_id: string,
  ticketId: string,
  authParams: AuthParams,
  realm: string,
) {
  const { env } = ctx;

  ctx.set("connection", realm);

  const ticket = await env.data.tickets.get(tenant_id, ticketId);

  if (!ticket) {
    throw new HTTPException(403, { message: "Ticket not found" });
  }

  await env.data.tickets.remove(tenant_id, ticketId);

  const provider = getProviderFromRealm(realm);

  let user = await getPrimaryUserByEmailAndProvider({
    userAdapter: env.data.users,
    tenant_id,
    email: ticket.email,
    provider,
  });

  if (user) {
    if (realm === "Username-Password-Authentication" && !user.email_verified) {
      const client = await getClient(ctx.env, ticket.client_id);

      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }

      await sendEmailVerificationEmail({
        env,
        client,
        user,
      });

      // TODO - move this page to auth2 BUT we need to be able to render JSX straight in here... WIP with Markus moving off TSOA
      const login2UniverifiedEmailUrl = new URL(
        `${env.LOGIN2_URL}/unverified-email`,
      );

      const stateDecoded = new URLSearchParams(authParams.state);

      login2UniverifiedEmailUrl.searchParams.set(
        "email",
        encodeURIComponent(ticket.email),
      );

      login2UniverifiedEmailUrl.searchParams.set(
        "lang",
        client.tenant.language || "sv",
      );

      const redirectUri = stateDecoded.get("redirect_uri");
      if (redirectUri) {
        login2UniverifiedEmailUrl.searchParams.set("redirect_uri", redirectUri);
      }

      const audience = stateDecoded.get("audience");
      if (audience) {
        login2UniverifiedEmailUrl.searchParams.set("audience", audience);
      }

      const nonce = stateDecoded.get("nonce");
      if (nonce) {
        login2UniverifiedEmailUrl.searchParams.set("nonce", nonce);
      }

      const scope = stateDecoded.get("scope");
      if (scope) {
        login2UniverifiedEmailUrl.searchParams.set("scope", scope);
      }

      const responseType = stateDecoded.get("response_type");
      if (responseType) {
        login2UniverifiedEmailUrl.searchParams.set(
          "response_type",
          responseType,
        );
      }

      const state2 = stateDecoded.get("state");
      if (state2) {
        login2UniverifiedEmailUrl.searchParams.set("state", state2);
      }

      const client_id = stateDecoded.get("client_id");
      if (client_id) {
        login2UniverifiedEmailUrl.searchParams.set("client_id", client_id);
      }

      // this will always be auth2
      const connection2 = stateDecoded.get("connection");
      if (connection2) {
        login2UniverifiedEmailUrl.searchParams.set("connection", connection2);
      }

      ctx.set("userName", user.email);
      ctx.set("connection", user.connection);
      ctx.set("client_id", client.id);
      const log = createTypeLog(
        LogTypes.FAILED_LOGIN,
        ctx,
        {},
        "Email not verified",
      );
      await ctx.env.data.logs.create(client.tenant_id, log);

      return new Response("Redirecting", {
        status: 302,
        headers: {
          location: login2UniverifiedEmailUrl.toString(),
        },
      });
    }
  }

  if (!user) {
    if (realm === "Username-Password-Authentication") {
      throw new Error(
        "ticket flow should not arrive here with non existent user - probably the provider is not set on the user",
      );
    }

    user = await env.data.users.create(tenant_id, {
      id: `email|${userIdGenerate()}`,
      email: ticket.email,
      name: ticket.email,
      provider: "email",
      connection: "email",
      email_verified: true,
      login_count: 1,
      is_social: false,
      last_ip: "",
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // TODO - set logging identity provider here
  }

  ctx.set("userId", user.id);
  ctx.set("userName", user.name || user.email);

  const sessionId = await setSilentAuthCookies(
    env,
    ticket.tenant_id,
    ticket.client_id,
    user,
  );

  // Update the user's last login
  await env.data.users.update(tenant_id, user.id, {
    last_login: new Date().toISOString(),
    login_count: user.login_count + 1,
    // This is specific to cloudflare
    last_ip: ctx.req.header("cf-connecting-ip") || "",
  });

  const log = createTypeLog(
    "scoa",
    ctx,
    // do we want to tunnel the body through?
    undefined,
    "Successful cross-origin authentication",
    { userId: user.id },
  );
  waitUntil(ctx, ctx.env.data.logs.create(tenant_id, log));

  return generateAuthResponse({
    env,
    userId: user.id,
    state: authParams.state,
    authParams: {
      scope: ticket.authParams?.scope,
      ...authParams,
    },
    sid: sessionId,
    user,
    responseType: authParams.response_type || AuthorizationResponseType.TOKEN,
    tenantId: ticket.tenant_id,
  });
}
