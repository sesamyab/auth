import { HTTPException } from "hono/http-exception";
import { Env, Var } from "../types";
import userIdGenerate from "../utils/userIdGenerate";
import { getClient } from "../services/clients";
import {
  getPrimaryUserByEmail,
  getPrimaryUserByEmailAndProvider,
} from "../utils/users";
import generateOTP from "../utils/otp";
import {
  CODE_EXPIRATION_TIME,
  EMAIL_VERIFICATION_EXPIRATION_TIME,
  UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS,
} from "../constants";
import {
  sendCode,
  sendLink,
  sendValidateEmailAddress,
} from "../controllers/email";
import { waitUntil } from "../utils/wait-until";
import { Context } from "hono";
import { createLogMessage } from "../utils/create-log-message";
import { AuthParams, Client, LogTypes, Login, User } from "authhero";
import { preUserSignupHook } from "../hooks";
import { SendType } from "../utils/getSendParamFromAuth0ClientHeader";
import { getClientInfo } from "../utils/client-info";

interface LoginParams {
  client_id: string;
  email: string;
  otp: string;
  ip?: string;
}

interface ValidateCodeResponse {
  status: "success" | "invalid_code" | "Invalid_session";
  user?: User;
  loginSession?: string;
}

export async function validateCode(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  params: LoginParams,
): Promise<ValidateCodeResponse> {
  const { env } = ctx;

  const client = await getClient(env, params.client_id);

  const code = await env.data.codes.get(client.tenant.id, params.otp, "otp");

  if (!code) {
    return {
      status: "invalid_code",
    };
  }

  const login = await env.data.logins.get(client.tenant.id, code.login_id);
  if (!login) {
    return {
      status: "invalid_code",
    };
  }

  if (
    login.useragent !== ctx.req.header("user-agent") ||
    (params.ip && login.ip !== params.ip)
  ) {
    return {
      status: "Invalid_session",
      loginSession: login.login_id,
    };
  }

  if (params.email && login.authParams.username !== params.email) {
    return {
      status: "Invalid_session",
      loginSession: login.login_id,
    };
  }

  await env.data.codes.used(client.tenant.id, code.code_id);

  const emailUser = await getPrimaryUserByEmailAndProvider({
    userAdapter: env.data.users,
    tenant_id: client.tenant.id,
    email: params.email,
    provider: "email",
  });

  if (emailUser) {
    return {
      status: "success",
      loginSession: login.login_id,
      user: emailUser,
    };
  }

  const user = await env.data.users.create(client.tenant.id, {
    user_id: `email|${userIdGenerate()}`,
    email: params.email,
    name: params.email,
    provider: "email",
    connection: "email",
    email_verified: true,
    last_ip: ctx.req.header("x-real-ip"),
    login_count: 1,
    last_login: new Date().toISOString(),
    is_social: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  ctx.set("userId", user.user_id);

  const log = createLogMessage(ctx, {
    type: LogTypes.SUCCESS_SIGNUP,
    description: "Successful signup",
  });

  waitUntil(ctx, env.data.logs.create(client.tenant.id, log));

  return {
    status: "success",
    loginSession: login.login_id,
    user,
  };
}

// this is not inside src/controllers/email/sendValidateEmailAddress
//  because we're mocking all that for the tests!
// We probably shouldn't do this and instead only mock the lowest level sendEmail function
// but then -> we don't have access to the templates in the bun tests...
// can we mock templates? or even properly use them?

interface sendEmailVerificationEmailParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  client: Client;
  user: User;
  authParams?: AuthParams;
}

export async function sendEmailVerificationEmail({
  ctx,
  client,
  user,
  authParams: authParamsInitial,
}: sendEmailVerificationEmailParams) {
  const { env } = ctx;

  const authParams: AuthParams = {
    ...authParamsInitial,
    client_id: client.id,
    username: user.email,
  };

  const loginSession = await env.data.logins.create(client.tenant.id, {
    expires_at: new Date(
      Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
    ).toISOString(),
    authParams,
    ...getClientInfo(ctx.req),
  });

  const state = loginSession.login_id;

  const code_id = generateOTP();

  await env.data.codes.create(client.tenant.id, {
    code_id,
    code_type: "email_verification",
    login_id: loginSession.login_id,
    expires_at: new Date(
      Date.now() + EMAIL_VERIFICATION_EXPIRATION_TIME,
    ).toISOString(),
  });

  await sendValidateEmailAddress(env, client, user.email, code_id, state);
}

interface sendOtpEmailParams {
  ctx: Context<{ Bindings: Env; Variables: Var }>;
  client: Client;
  sendType: SendType;
  session: Login;
}

export async function sendOtpEmail({
  ctx,
  client,
  session,
  sendType,
}: sendOtpEmailParams) {
  const { env } = ctx;

  if (!session.authParams.username) {
    throw new HTTPException(400, { message: "Missing username" });
  }

  const user = await getPrimaryUserByEmail({
    userAdapter: env.data.users,
    tenant_id: client.tenant.id,
    email: session.authParams.username,
  });
  if (user) {
    ctx.set("userId", user.user_id);
  }

  if (!user) {
    try {
      await preUserSignupHook(
        ctx,
        client,
        ctx.env.data,
        session.authParams.username,
      );
    } catch {
      const log = createLogMessage(ctx, {
        type: LogTypes.FAILED_SIGNUP,
        description: "Public signup is disabled",
      });

      await ctx.env.data.logs.create(client.tenant.id, log);

      throw new HTTPException(403, {
        message: "Public signup is disabled",
      });
    }
  }

  const createdCode = await ctx.env.data.codes.create(client.tenant.id, {
    code_id: generateOTP(),
    code_type: "otp",
    login_id: session.login_id,
    expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME).toISOString(),
  });

  if (sendType === "link") {
    waitUntil(
      ctx,
      sendLink(
        ctx,
        client,
        session.authParams.username,
        createdCode.code_id,
        session.authParams,
      ),
    );
  } else {
    waitUntil(
      ctx,
      sendCode(ctx, client, session.authParams.username, createdCode.code_id),
    );
  }
}
