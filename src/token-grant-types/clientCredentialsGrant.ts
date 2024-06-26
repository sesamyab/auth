import {
  ClientCredentialsGrantTypeParams,
  AuthorizationResponseType,
  AuthParams,
  Env,
  Var,
} from "../types";
import { getClient } from "../services/clients";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { nanoid } from "nanoid";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";

export async function clientCredentialsGrant(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  params: ClientCredentialsGrantTypeParams,
) {
  const client = await getClient(ctx.env, params.client_id);
  if (!client) {
    throw new HTTPException(400, { message: "Client not found" });
  }

  if (client.client_secret !== params.client_secret) {
    throw new HTTPException(403, { message: "Invalid secret" });
  }

  const authParams: AuthParams = {
    client_id: client.id,
    scope: params.scope,
    redirect_uri: "",
  };

  return generateAuthResponse({
    responseType: AuthorizationResponseType.TOKEN,
    env: ctx.env,
    tenantId: client.tenant_id,
    userId: client.id,
    sid: nanoid(),
    authParams,
  });
}
