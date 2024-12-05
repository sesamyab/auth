import { Env, Var } from "../types";
import { getClient } from "../services/clients";
import { HTTPException } from "hono/http-exception";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { Context } from "hono";
import {
  AuthorizationCodeGrantTypeParams,
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "authhero";
import { getImpersonatedUser } from "../utils/users";

export async function authorizeCodeGrant(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  params: AuthorizationCodeGrantTypeParams,
) {
  const client = await getClient(ctx.env, params.client_id);
  ctx.set("client_id", client.id);
  ctx.set("tenant_id", client.tenant.id);

  const oauth2Code = await ctx.env.data.codes.get(
    client.tenant.id,
    params.code,
    "authorization_code",
  );

  if (!oauth2Code || !oauth2Code.user_id) {
    throw new HTTPException(400, { message: "Code not found" });
  }

  if (oauth2Code.used_at || new Date(oauth2Code.expires_at) < new Date()) {
    throw new HTTPException(400, { message: "Code allready used or expired" });
  }

  const login = await ctx.env.data.logins.get(
    client.tenant.id,
    oauth2Code.login_id,
  );

  if (!login) {
    throw new HTTPException(400, { message: "Login not found" });
  }

  // Set the response_type to token id_token for the code grant flow
  login.authParams.response_type = AuthorizationResponseType.TOKEN_ID_TOKEN;
  login.authParams.response_mode = AuthorizationResponseMode.FORM_POST;

  const user = await ctx.env.data.users.get(
    client.tenant.id,
    oauth2Code.user_id,
  );
  if (!user) {
    throw new HTTPException(400, { message: "User not found" });
  }
  ctx.set("userName", user.email);
  ctx.set("connection", user.connection);
  ctx.set("userId", user.user_id);

  // TODO: Temporary fix for the default client
  const defaultClient = await getClient(ctx.env, "DEFAULT_CLIENT");

  if (
    client.client_secret !== params.client_secret &&
    defaultClient?.client_secret !== params.client_secret
  ) {
    throw new HTTPException(403, { message: "Invalid Secret" });
  }

  const actAs = await getImpersonatedUser(
    ctx.env.data.users,
    client.tenant.id,
    user.email,
    login.authParams.act_as,
  );

  return generateAuthResponse({
    ctx,
    authParams: login.authParams,
    user,
    actAs,
    client,
    authFlow: "code",
  });
}
