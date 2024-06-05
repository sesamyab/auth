import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { AuthParams, Env, Var } from "../types";
import { UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS } from "../constants";
import { nanoid } from "nanoid";
import { UniversalLoginSession } from "../adapters/interfaces/UniversalLoginSession";
import { getClient } from "../services/clients";
import generateOTP from "../utils/otp";
import { getSendParamFromAuth0ClientHeader } from "../utils/getSendParamFromAuth0ClientHeader";
import { waitUntil } from "../utils/wait-until";
import { sendCode, sendLink } from "../controllers/email";

interface UniversalAuthParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  authParams: AuthParams;
  auth0Client?: string;
  emailHint?: string;
}

export async function universalAuth({
  ctx,
  authParams,
  auth0Client,
  emailHint,
}: UniversalAuthParams) {
  const client = await getClient(ctx.env, authParams.client_id);

  if (!client) {
    throw new HTTPException(400, { message: "Client not found" });
  }

  const session: UniversalLoginSession = {
    id: nanoid(),
    tenant_id: client.tenant_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(
      Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
    ).toISOString(),
    authParams,
    auth0Client,
  };

  await ctx.env.data.universalLoginSessions.create(session);

  if (emailHint) {
    const { env } = ctx;
    // TODO - extract this out as a helper. Duplciated on routes as well
    // need this code again for when user hits "enter a code instead" button on the password entry page
    const code = generateOTP();

    const {
      audience,
      code_challenge_method,
      code_challenge,
      username,
      vendor_id,
      ...otpAuthParams
    } = session.authParams;

    // duplicated in many places under many names
    const OTP_EXPIRATION_TIME = 30 * 60 * 1000;

    await env.data.OTP.create({
      id: nanoid(),
      code,
      // should we be doing any cleaning here?
      email: emailHint,
      client_id: session.authParams.client_id,
      send: "code",
      authParams: otpAuthParams,
      tenant_id: client.tenant_id,
      created_at: new Date(),
      expires_at: new Date(Date.now() + OTP_EXPIRATION_TIME),
    });

    // request.ctx.set("log", `Code: ${code}`);

    const sendType = getSendParamFromAuth0ClientHeader(session.auth0Client);

    // TODO - read cookie here to decide if go to password entry step?

    if (sendType === "link") {
      const magicLink = new URL(env.ISSUER);
      magicLink.pathname = "passwordless/verify_redirect";
      if (session.authParams.scope) {
        magicLink.searchParams.set("scope", session.authParams.scope);
      }
      if (session.authParams.response_type) {
        magicLink.searchParams.set(
          "response_type",
          session.authParams.response_type,
        );
      }
      if (session.authParams.redirect_uri) {
        magicLink.searchParams.set(
          "redirect_uri",
          session.authParams.redirect_uri,
        );
      }
      if (session.authParams.audience) {
        magicLink.searchParams.set("audience", session.authParams.audience);
      }
      if (session.authParams.state) {
        magicLink.searchParams.set("state", session.authParams.state);
      }
      if (session.authParams.nonce) {
        magicLink.searchParams.set("nonce", session.authParams.nonce);
      }

      magicLink.searchParams.set("connection", "email");
      magicLink.searchParams.set("client_id", session.authParams.client_id);
      magicLink.searchParams.set("email", emailHint);
      magicLink.searchParams.set("verification_code", code);
      magicLink.searchParams.set("nonce", "nonce");

      waitUntil(ctx, sendLink(env, client, emailHint, code, magicLink.href));
    } else {
      waitUntil(ctx, sendCode(env, client, emailHint, code));
    }

    return ctx.redirect(`/u/enter-code?state=${session.id}`);
  }

  return ctx.redirect(`/u/code?state=${session.id}`);
}
