import { base64ToHex } from "../utils/base64";
import {
  AuthorizationCodeGrantTypeParams,
  AuthParams,
  CodeResponse,
  Env,
  Profile,
  TokenResponse,
} from "../types";
import { InvalidClientError } from "../errors";
import { getClient } from "../services/clients";
import { generateAuthResponse } from "../helpers/generate-auth-response";
import hash from "../utils/hash";

export async function authorizeCodeGrant(
  env: Env,
  params: AuthorizationCodeGrantTypeParams,
): Promise<TokenResponse | CodeResponse> {
  // Either get the instance based on the id or the code
  const stateInstance = env.stateFactory.getInstanceById(
    base64ToHex(params.code),
  );

  const stateString = await stateInstance.getState.query();
  if (!stateString) {
    throw new Error("State required");
  }

  const state: {
    userId: string;
    authParams: AuthParams;
    user: Profile;
    sid: string;
  } = JSON.parse(stateString);

  if (params.client_id && state.authParams.client_id !== params.client_id) {
    throw new InvalidClientError();
  }

  const client = await getClient(env, state.authParams.client_id);

  // Check the secret if this is a code grant flow
  const secretHash = await hash(params.client_secret);
  if (client.clientSecret !== secretHash) {
    throw new InvalidClientError("Invalid Secret");
  }

  if (!state.authParams.response_type) {
    throw new Error("Response type needs to be defined");
  }

  return generateAuthResponse({
    env,
    ...state,
    responseType: state.authParams.response_type,
  });
}
