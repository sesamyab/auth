// src/users/usersController.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Route,
  Tags,
} from "@tsoa/runtime";
import { RequestWithContext } from "../../types/RequestWithContext";
import { getClient } from "../../services/clients";
import { AuthParams } from "../../types/AuthParams";
import { sendCode } from "../../controllers/email";
import { generateAuthResponse } from "../../helpers/generate-auth-response";
import { applyTokenResponse } from "../../helpers/apply-token-response";
import { base64ToHex } from "../../utils/base64";

export interface PasswordlessOptions {
  client_id: string;
  client_secret?: string;
  connection: string;
  email: string;
  send: string;
  authParams: Omit<AuthParams, "client_id">;
}

export interface LoginTicket {
  login_ticket: string;
  co_verifier: string;
  co_id: string;
}

export interface LoginError {
  error: string;
  error_description: string;
}

@Route("passwordless")
@Tags("passwordless")
export class PasswordlessController extends Controller {
  @Post("start")
  public async startPasswordless(
    @Body() body: PasswordlessOptions,
    @Request() request: RequestWithContext,
  ): Promise<string> {
    const { env } = request.ctx;

    const client = await getClient(env, body.client_id);
    if (!client) {
      throw new Error("Client not found");
    }

    const user = env.userFactory.getInstanceByName(
      `${client.tenant_id}|${body.email}`,
    );
    const { code } = await user.createAuthenticationCode.mutate({
      authParams: {
        ...body.authParams,
        client_id: body.client_id,
      },
    });

    await sendCode(env, client, body.email, code);

    return "ok";
  }

  /*
          scope: openid profile email
response_type: token id_token
redirect_uri: https://login2-4pcueclm6.vercel.sesamy.dev/callback
audience: https://sesamy.com
state: ACRvQXbA_AbvXJGiorgmDAjakL3jXjYl
nonce: oO0sJ_sq127hoMG8pM.5sjgk.IZQ8oc_
verification_code: 625452
connection: email
client_id: 0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW
email: dan+456@sesamy.com
     */

  @Get("verify_redirect")
  public async verifyRedirect(
    @Request() request: RequestWithContext,
    @Query("scope") scope: string,
    @Query("response_type") response_type: string,
    @Query("redirect_uri") redirect_uri: string,
    @Query("audience") audience: string,
    @Query("state") state: string,
    @Query("nonce") nonce: string,
    @Query("verification_code") verification_code: string,
    @Query("connection") connection: string,
    @Query("client_id") client_id: string,
    @Query("email") email: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const client = await getClient(env, client_id);
    if (!client) {
      throw new Error("Client not found");
    }

    const stateInstance = env.stateFactory.getInstanceById(base64ToHex(state));
    const authParams = await stateInstance.getState.query();

    const user = env.userFactory.getInstanceByName(
      `${client.tenant_id}|${email}`,
    );
    await user.validateAuthenticationCode.mutate({
      code: verification_code,
      email,
      tenantId: client.tenant_id,
    });

    const tokenResponse = generateAuthResponse(env, client, email, {
      scope,
      response_type,
      redirect_uri,
      audience,
      state,
      nonce,
      connection,
      client_id,
    });

    return applyTokenResponse(this, tokenResponse, authParams);
  }
}
