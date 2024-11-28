import { AuthParams } from "@authhero/adapter-interfaces";
import { Env } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { Var } from "../types/Var";
import { getPrimaryUserByEmailAndProvider } from "../utils/users";
import { getClient } from "../services/clients";

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

  const code = await env.data.codes.get(tenant_id, ticketId, "ticket");
  if (!code) {
    throw new HTTPException(403, { message: "Ticket not found" });
  }

  const login = await env.data.logins.get(tenant_id, code.login_id);

  if (!login || !login.authParams.username) {
    throw new HTTPException(403, { message: "Session not found" });
  }

  const client = await getClient(ctx.env, login.authParams.client_id);
  ctx.set("client_id", login.authParams.client_id);

  await env.data.codes.remove(tenant_id, ticketId);

  const provider = getProviderFromRealm(realm);

  let user = await getPrimaryUserByEmailAndProvider({
    userAdapter: env.data.users,
    tenant_id,
    email: login.authParams.username,
    provider,
  });

  if (!user) {
    user = await env.data.users.create(tenant_id, {
      user_id: `email|${userIdGenerate()}`,
      email: login.authParams.username,
      name: login.authParams.username,
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
  }

  ctx.set("userName", user.email);
  ctx.set("userId", user.user_id);

  return generateAuthResponse({
    ctx,
    authParams: {
      scope: login.authParams?.scope,
      ...authParams,
    },
    user,
    client,
    authFlow: "cross-origin",
  });
}
