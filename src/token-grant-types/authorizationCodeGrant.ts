import {
  AuthorizationCodeGrantTypeParams,
  ClientCredentialGrantTypeParams,
  AuthorizationResponseType,
  AuthParams,
  CodeResponse,
  Env,
  TokenResponse,
  User,
} from "../types";
import { getClient } from "../services/clients";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import hash from "../utils/hash";
import { nanoid } from "nanoid";
import { stateDecode } from "../utils/stateEncode";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { Var } from "../types/Var";

export async function authorizeCodeGrant(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  params: AuthorizationCodeGrantTypeParams,
) {
  const state: {
    userId: string;
    authParams: AuthParams;
    user: User;
    sid: string;
  } = stateDecode(params.code); // this "code" is actually a stringified base64 encoded state object...

  if (params.client_id && state.authParams.client_id !== params.client_id) {
    throw new HTTPException(403, { message: "Invalid Client" });
  }

  const client = await getClient(ctx.env, state.authParams.client_id);
  if (!client) {
    throw new HTTPException(400, { message: "Client not found" });
  }

  // Check the secret if this is a code grant flow
  const secretHash = await hash(params.client_secret);
  if (client.client_secret !== secretHash) {
    throw new HTTPException(403, { message: "Invalid Secret" });
  }

  const token = generateAuthResponse({
    env: ctx.env,
    ...state,
    responseType: AuthorizationResponseType.TOKEN_ID_TOKEN,
  });

  return ctx.json(token);
}

export async function clientCredentialsGrant(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  params: ClientCredentialGrantTypeParams,
) {
  const client = await getClient(ctx.env, params.client_id);
  if (!client) {
    throw new HTTPException(400, { message: "Client not found" });
  }

  if (client.client_secret !== params.client_secret) {
    throw new Error("Invalid secret");
  }

  const authParams: AuthParams = {
    client_id: client.id,
    scope: params.scope,
    redirect_uri: "",
  };

  const tokens = await generateAuthResponse({
    env: ctx.env,
    responseType: AuthorizationResponseType.TOKEN,
    userId: client.id,
    sid: nanoid(),
    authParams,
  });

  return ctx.json(tokens);
}
