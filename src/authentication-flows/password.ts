import { Context } from "hono";
import bcryptjs from "bcryptjs";
import { Var, Env } from "../types";
import {
  getPrimaryUserByEmailAndProvider,
  getUserByEmailAndProvider,
  getUsersByEmail,
} from "../utils/users";
import {
  CODE_EXPIRATION_TIME,
  LOGIN_SESSION_EXPIRATION_TIME,
} from "../constants";
import generateOTP from "../utils/otp";
import { sendResetPassword } from "../controllers/email";
import { createLogMessage } from "../utils/create-log-message";
import { sendEmailVerificationEmail } from "./passwordless";
import { HTTPException } from "hono/http-exception";
import { CustomException } from "../models/CustomError";
import userIdGenerate from "../utils/userIdGenerate";
import { AuthParams, Client, LogTypes } from "authhero";
import { getClientInfo } from "../utils/client-info";

export async function requestPasswordReset(
  ctx: Context<{
    Bindings: Env;
    Variables: Var;
  }>,
  client: Client,
  email: string,
  state: string
) {
  let user = await getPrimaryUserByEmailAndProvider({
    userAdapter: ctx.env.data.users,
    tenant_id: client.tenant.id,
    email,
    provider: "auth2",
  });

  if (!user) {
    const matchingUser = await getUsersByEmail(
      ctx.env.data.users,
      client.tenant.id,
      email
    );

    if (!matchingUser.length) {
      return;
    }

    // Create a new user if it doesn't exist
    user = await ctx.env.data.users.create(client.tenant.id, {
      user_id: `email|${userIdGenerate()}`,
      email,
      email_verified: false,
      is_social: false,
      provider: "auth2",
      connection: "Username-Password-Authentication",
    });
  }

  const loginSession = await ctx.env.data.logins.create(client.tenant.id, {
    expires_at: new Date(
      Date.now() + LOGIN_SESSION_EXPIRATION_TIME
    ).toISOString(),
    authParams: {
      client_id: client.id,
      username: email,
    },
    ...getClientInfo(ctx.req),
  });

  let code_id = generateOTP();
  let existingCode = await ctx.env.data.codes.get(
    client.tenant.id,
    code_id,
    "password_reset"
  );

  // This is a slighly hacky way to ensure we don't generate a code that already exists
  while (existingCode) {
    code_id = generateOTP();
    existingCode = await ctx.env.data.codes.get(
      client.tenant.id,
      code_id,
      "password_reset"
    );
  }

  const createdCode = await ctx.env.data.codes.create(client.tenant.id, {
    code_id: generateOTP(),
    code_type: "password_reset",
    login_id: loginSession.login_id,
    expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME).toISOString(),
  });

  await sendResetPassword(ctx.env, client, email, createdCode.code_id, state);
}

export async function loginWithPassword(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  client: Client,
  authParams: AuthParams & { password: string }
) {
  const { env } = ctx;

  const email = authParams.username;
  if (!email) {
    throw new HTTPException(400, { message: "Username is required" });
  }

  const user = await getUserByEmailAndProvider({
    userAdapter: ctx.env.data.users,
    tenant_id: client.tenant.id,
    email,
    provider: "auth2",
  });

  if (!user) {
    throw new CustomException(403, {
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  ctx.set("connection", user.connection);
  ctx.set("strategy", "Username-Password-Authentication");
  ctx.set("strategy_type", "database");
  ctx.set("userId", user.user_id);

  const { password } = await env.data.passwords.get(
    client.tenant.id,
    user.user_id
  );

  const valid = await bcryptjs.compare(authParams.password, password);

  if (!valid) {
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN_INCORRECT_PASSWORD,
      description: "Invalid password",
    });

    await ctx.env.data.logs.create(client.tenant.id, log);

    throw new CustomException(403, {
      message: "Invalid password",
      code: "INVALID_PASSWORD",
    });
  }

  if (!user.email_verified && client.email_validation === "enforced") {
    const { password, ...cleanAuthParams } = authParams;
    await sendEmailVerificationEmail({
      ctx,
      client,
      user,
      authParams: cleanAuthParams,
    });

    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_LOGIN,
      description: "Email not verified",
    });
    await ctx.env.data.logs.create(client.tenant.id, log);

    throw new CustomException(403, {
      message: "Email not verified",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  if (!user.linked_to) {
    return user;
  }

  const primaryUser = await env.data.users.get(
    client.tenant.id,
    user.linked_to
  );
  if (!primaryUser) {
    throw new CustomException(403, {
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }
  return primaryUser;
}
