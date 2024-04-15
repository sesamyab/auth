import {
  AuthorizationResponseType,
  AuthParams,
  Env,
  PKCEAuthorizationCodeGrantTypeParams,
  User,
} from "../types";
import { getClient } from "../services/clients";
import { computeCodeChallenge } from "../helpers/pkce";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import { setSilentAuthCookies } from "../helpers/silent-auth-cookie-new";
import { stateDecode } from "../utils/stateEncode";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { Var } from "../types/Var";

export async function pkceAuthorizeCodeGrant(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  params: PKCEAuthorizationCodeGrantTypeParams,
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

  if (state.authParams.client_id !== client.id) {
    throw new HTTPException(403, { message: "Invalid Client" });
  }

  if (!state.authParams.code_challenge_method) {
    throw new HTTPException(403, { message: "Code challenge not available" });
  }

  const challenge = await computeCodeChallenge(
    params.code_verifier,
    state.authParams.code_challenge_method,
  );
  if (challenge !== state.authParams.code_challenge) {
    throw new HTTPException(403, { message: "Invalid Code Challange" });
  }

  const sessionId = await setSilentAuthCookies(
    ctx.env,
    client.tenant_id,
    client.id,
    state.user,
  );

  const tokens = generateAuthResponse({
    env: ctx.env,
    ...state,
    responseType: AuthorizationResponseType.TOKEN_ID_TOKEN,
  });

  return ctx.json(tokens, {
    headers: {
      "set-cookie": `sid=${sessionId}; Path=/; HttpOnly; Secure; SameSite=None`,
    },
  });
}
