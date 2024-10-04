import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Env, Var } from "../../types";
import ResetPasswordPage from "../../components/ResetPasswordPage";
import validatePassword from "../../utils/validatePassword";
import {
  getUserByEmailAndProvider,
  getPrimaryUserByEmailAndProvider,
  getPrimaryUserByEmail,
} from "../../utils/users";
import { getClient } from "../../services/clients";
import { HTTPException } from "hono/http-exception";
import i18next from "i18next";
import EnterPasswordPage from "../../components/EnterPasswordPage";
import EnterEmailPage from "../../components/EnterEmailPage";
import EnterCodePage from "../../components/EnterCodePage";
import SignupPage from "../../components/SignUpPage";
import MessagePage from "../../components/Message";
import EmailValidatedPage from "../../components/EmailValidatedPage";
import { generateAuthResponse } from "../../helpers/generate-auth-response";
import { Context } from "hono";
import ForgotPasswordPage from "../../components/ForgotPasswordPage";
import generateOTP from "../../utils/otp";
import {
  sendLink,
  sendCode,
  sendSignupValidateEmailAddress,
} from "../../controllers/email";
import { validateCode } from "../../authentication-flows/passwordless";
import { getUsersByEmail } from "../../utils/users";
import userIdGenerate from "../../utils/userIdGenerate";
import { sendEmailVerificationEmail } from "../../authentication-flows/passwordless";
import { getSendParamFromAuth0ClientHeader } from "../../utils/getSendParamFromAuth0ClientHeader";
import { waitUntil } from "../../utils/wait-until";
import { fetchVendorSettings } from "../../utils/fetchVendorSettings";
import { createLogMessage } from "../../utils/create-log-message";
import {
  loginWithPassword,
  requestPasswordReset,
} from "../../authentication-flows/password";
import { CustomException } from "../../models/CustomError";
import { CODE_EXPIRATION_TIME } from "../../constants";
import {
  Client,
  ListLogsResponse,
  Login,
  LogTypes,
  User,
} from "@authhero/adapter-interfaces";
import CheckEmailPage from "../../components/CheckEmailPage";
import { getAuthCookie } from "../../services/cookies";
import PreSignupPage from "../../components/PreSignUpPage";
import PreSignupComfirmationPage from "../../components/PreSignUpConfirmationPage";
import bcryptjs from "bcryptjs";
import UnverifiedEmailPage from "../../components/UnverifiedEmailPage";
import ForgotPasswordSentPage from "../../components/ForgotPasswordSentPage";
import { preUserSignupHook } from "../../hooks";

async function initJSXRoute(ctx: Context, state: string) {
  const { env } = ctx;
  const session: Login = await env.data.logins.get(
    ctx.var.tenant_id || "",
    state,
  );
  if (!session) {
    throw new HTTPException(400, { message: "Session not found" });
  }

  const client = await getClient(env, session.authParams.client_id);
  ctx.set("client_id", client.id);
  ctx.set("tenant_id", client.tenant.id);

  const tenant = await env.data.tenants.get(client.tenant.id);
  if (!tenant) {
    throw new HTTPException(400, { message: "Tenant not found" });
  }

  const vendorSettings = await fetchVendorSettings(
    env,
    client.id,
    session.authParams.vendor_id,
  );

  const loginSessionLanguage = session.authParams.ui_locales
    ?.split(" ")
    .map((locale) => locale.split("-")[0])
    .find((language) => {
      if (Array.isArray(i18next.options.supportedLngs)) {
        return i18next.options.supportedLngs.includes(language);
      }
    });

  await i18next.changeLanguage(loginSessionLanguage || tenant.language || "sv");

  return { vendorSettings, client, tenant, session };
}

async function handleLogin(
  ctx: Context,
  user: User,
  session: Login,
  client: Client,
) {
  if (session.authParams.redirect_uri) {
    ctx.set("userName", user.email);
    ctx.set("connection", user.connection);
    ctx.set("userId", user.user_id);

    return generateAuthResponse({
      ctx,
      client,
      authParams: session.authParams,
      user,
    });
  }

  const vendorSettings = await fetchVendorSettings(
    ctx.env,
    client.id,
    session.authParams.vendor_id,
  );

  return ctx.html(
    <MessagePage
      message="You are logged in"
      pageTitle="Logged in"
      vendorSettings={vendorSettings}
    />,
  );
}

async function usePasswordLogin(
  ctx: Context,
  client: Client,
  username: string,
  login_selection?: "password" | "code",
) {
  if (login_selection !== undefined) {
    return login_selection === "password";
  }

  // Get primary user for email
  const user = await getPrimaryUserByEmail({
    userAdapter: ctx.env.data.users,
    tenant_id: client.tenant.id,
    email: username,
  });

  if (user) {
    // Get last login
    const lastLogins: ListLogsResponse = await ctx.env.data.logs.list(
      client.tenant.id,
      {
        page: 0,
        per_page: 10,
        include_totals: false,
        sort: { sort_by: "date", sort_order: "desc" },
        q: `type:${LogTypes.SUCCESS_LOGIN} user_id:${user.user_id}`,
      },
    );

    const [lastLogin] = lastLogins.logs.filter(
      (log) =>
        log.strategy &&
        ["Username-Password-Authentication", "passwordless", "email"].includes(
          log.strategy,
        ),
    );

    if (lastLogin) {
      return lastLogin.strategy === "Username-Password-Authentication";
    }
  }

  const promptSettings = await ctx.env.data.promptSettings.get(
    client.tenant.id,
  );
  return promptSettings.password_first;
}

export const loginRoutes = new OpenAPIHono<{ Bindings: Env; Variables: Var }>()
  // --------------------------------
  // GET /u/enter-password
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/enter-password",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");

      const { vendorSettings, client, session } = await initJSXRoute(
        ctx,
        state,
      );

      if (!session.authParams.username) {
        throw new HTTPException(400, { message: "Username required" });
      }

      return ctx.html(
        <EnterPasswordPage
          vendorSettings={vendorSettings}
          email={session.authParams.username}
          state={state}
          client={client}
        />,
      );
    },
  )
  // --------------------------------
  // POST /u/enter-password
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/enter-password",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
        body: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: z.object({
                password: z.string(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");
      const body = ctx.req.valid("form");
      const { password } = body;

      const { vendorSettings, client, session } = await initJSXRoute(
        ctx,
        state,
      );

      const { username } = session.authParams;

      if (!username) {
        throw new HTTPException(400, { message: "Username required" });
      }
      ctx.set("userName", username);

      try {
        const user = await loginWithPassword(ctx, client, {
          ...session.authParams,
          password,
        });

        return handleLogin(ctx, user, session, client);
      } catch (err) {
        const customException = err as CustomException;

        if (
          customException.code === "INVALID_PASSWORD" ||
          customException.code === "USER_NOT_FOUND"
        ) {
          return ctx.html(
            <EnterPasswordPage
              vendorSettings={vendorSettings}
              email={username}
              error={i18next.t("invalid_password")}
              state={state}
              client={client}
            />,
            400,
          );
        } else if (customException.code === "EMAIL_NOT_VERIFIED") {
          // login2 looks a bit better - https://login2.sesamy.dev/unverified-email
          return ctx.html(
            <UnverifiedEmailPage
              vendorSettings={vendorSettings}
              state={state}
            />,

            400,
          );
        }

        return ctx.html(
          <EnterPasswordPage
            vendorSettings={vendorSettings}
            email={username}
            error={customException.message}
            state={state}
            client={client}
          />,
          400,
        );
      }
    },
  )
  // --------------------------------
  // GET /u/reset-password
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/reset-password",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
          code: z.string().openapi({
            description: "The code parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");

      const { vendorSettings, session } = await initJSXRoute(ctx, state);

      if (!session.authParams.username) {
        throw new HTTPException(400, { message: "Username required" });
      }

      return ctx.html(
        <ResetPasswordPage
          vendorSettings={vendorSettings}
          email={session.authParams.username}
        />,
      );
    },
  )
  // --------------------------------
  // POST /u/reset-password
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/reset-password",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
          code: z.string().openapi({
            description: "The code parameter from the authorization request",
          }),
        }),
        body: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: z.object({
                password: z.string(),
                "re-enter-password": z.string(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state, code } = ctx.req.valid("query");
      const { password, "re-enter-password": reEnterPassword } =
        ctx.req.valid("form");

      const { env } = ctx;

      const { vendorSettings, client, session } = await initJSXRoute(
        ctx,
        state,
      );

      if (!session.authParams.username) {
        throw new HTTPException(400, { message: "Username required" });
      }

      if (password !== reEnterPassword) {
        return ctx.html(
          <ResetPasswordPage
            error={i18next.t("create_account_passwords_didnt_match")}
            vendorSettings={vendorSettings}
            email={session.authParams.username}
          />,
          400,
        );
      }

      if (!validatePassword(password)) {
        return ctx.html(
          <ResetPasswordPage
            error={i18next.t("create_account_weak_password")}
            vendorSettings={vendorSettings}
            email={session.authParams.username}
          />,
          400,
        );
      }

      // Note! we don't use the primary user here. Something to be careful of
      // this means the primary user could have a totally different email address
      const user = await getUserByEmailAndProvider({
        userAdapter: env.data.users,
        tenant_id: client.tenant.id,
        email: session.authParams.username,
        provider: "auth2",
      });

      if (!user) {
        throw new HTTPException(400, { message: "User not found" });
      }

      try {
        const foundCode = await env.data.codes.get(
          client.tenant.id,
          code,
          "password_reset",
        );

        if (!foundCode) {
          // surely we should check this on the GET rather than have the user waste time entering a new password?
          // THEN we can assume here it works and throw a hono exception if it doesn't... because it's an issue with our system
          // ALTHOUGH the user could have taken a long time to enter the password...
          return ctx.html(
            <ResetPasswordPage
              error="Code not found or expired"
              vendorSettings={vendorSettings}
              email={session.authParams.username}
            />,
            400,
          );
        }

        await env.data.passwords.update(client.tenant.id, {
          user_id: user.user_id,
          password: await bcryptjs.hash(password, 10),
          algorithm: "bcrypt",
        });

        // we could do this on the GET...
        if (!user.email_verified) {
          await env.data.users.update(client.tenant.id, user.user_id, {
            email_verified: true,
          });
        }
      } catch (err) {
        // seems like we should not do this catch... try and see what happens
        return ctx.html(
          <ResetPasswordPage
            error="The password could not be reset"
            vendorSettings={vendorSettings}
            email={session.authParams.username}
          />,
          400,
        );
      }

      return ctx.html(
        <MessagePage
          message={i18next.t("password_has_been_reset")}
          vendorSettings={vendorSettings}
          state={state}
        />,
      );
    },
  )
  // --------------------------------
  // GET /u/forgot-password
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/forgot-password",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");

      const { vendorSettings, session } = await initJSXRoute(ctx, state);

      return ctx.html(
        <ForgotPasswordPage
          vendorSettings={vendorSettings}
          state={state}
          email={session.authParams.username}
        />,
      );
    },
  )
  // -------------------------------
  // POST /u/forgot-password
  // -------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/forgot-password",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");

      const { vendorSettings, client, session } = await initJSXRoute(
        ctx,
        state,
      );

      await requestPasswordReset(
        ctx,
        client,
        session.authParams.username!,
        session.login_id,
      );

      return ctx.html(
        <ForgotPasswordSentPage
          vendorSettings={vendorSettings}
          state={state}
        />,
      );
    },
  )
  // --------------------------------
  // GET /u/enter-email
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/enter-email",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");

      const { vendorSettings, session, client } = await initJSXRoute(
        ctx,
        state,
      );

      return ctx.html(
        <EnterEmailPage
          vendorSettings={vendorSettings}
          session={session}
          client={client}
          email={session.authParams.username}
        />,
      );
    },
  )
  // --------------------------------
  // POST /u/enter-email
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/enter-email",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
        body: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: z.object({
                username: z.string().transform((u) => u.toLowerCase()),
                login_selection: z.enum(["code", "password"]).optional(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { env } = ctx;
      const { state } = ctx.req.valid("query");
      const params = ctx.req.valid("form");
      ctx.set("body", params);
      ctx.set("userName", params.username);

      const { client, session, vendorSettings } = await initJSXRoute(
        ctx,
        state,
      );
      ctx.set("client_id", client.id);

      const user = await getPrimaryUserByEmail({
        userAdapter: env.data.users,
        tenant_id: client.tenant.id,
        email: params.username,
      });
      if (user) {
        ctx.set("userId", user.user_id);
      }

      if (!user) {
        try {
          await preUserSignupHook(ctx, client, ctx.env.data, params.username);
        } catch (err) {
          const log = createLogMessage(ctx, {
            type: LogTypes.FAILED_SIGNUP,
            description: "Public signup is disabled",
          });

          await ctx.env.data.logs.create(client.tenant.id, log);

          return ctx.html(
            <EnterEmailPage
              vendorSettings={vendorSettings}
              session={session}
              error={i18next.t("user_account_does_not_exist")}
              email={params.username}
              client={client}
            />,
            400,
          );
        }
      }

      // Add the username to the state
      session.authParams.username = params.username;
      await env.data.logins.update(client.tenant.id, session.login_id, session);

      if (
        await usePasswordLogin(
          ctx,
          client,
          params.username,
          params.login_selection,
        )
      ) {
        return ctx.redirect(`/u/enter-password?state=${state}`);
      }

      let code_id = generateOTP();
      let existingCode = await env.data.codes.get(
        client.tenant.id,
        code_id,
        "otp",
      );

      // This is a slighly hacky way to ensure we don't generate a code that already exists
      while (existingCode) {
        code_id = generateOTP();
        existingCode = await env.data.codes.get(
          client.tenant.id,
          code_id,
          "otp",
        );
      }

      const createdCode = await ctx.env.data.codes.create(client.tenant.id, {
        code_id,
        code_type: "otp",
        login_id: session.login_id,
        expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME).toISOString(),
      });

      const sendType = getSendParamFromAuth0ClientHeader(session.auth0Client);

      if (sendType === "link") {
        waitUntil(
          ctx,
          sendLink(
            ctx,
            client,
            params.username,
            createdCode.code_id,
            session.authParams,
          ),
        );
      } else {
        waitUntil(
          ctx,
          sendCode(ctx, client, params.username, createdCode.code_id),
        );
      }

      return ctx.redirect(`/u/enter-code?state=${state}`);
    },
  )
  // --------------------------------
  // GET /u/enter-code
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/enter-code",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");

      const { vendorSettings, session, client } = await initJSXRoute(
        ctx,
        state,
      );

      if (!session.authParams.username) {
        throw new HTTPException(400, {
          message: "Username not found in state",
        });
      }

      const passwordUser = await getPrimaryUserByEmailAndProvider({
        userAdapter: ctx.env.data.users,
        tenant_id: client.tenant.id,
        email: session.authParams.username,
        provider: "auth2",
      });

      return ctx.html(
        <EnterCodePage
          vendorSettings={vendorSettings}
          email={session.authParams.username}
          state={state}
          client={client}
          hasPasswordLogin={!!passwordUser}
        />,
      );
    },
  )
  // --------------------------------
  // POST /u/enter-code
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/enter-code",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state",
          }),
        }),
        body: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: z.object({
                code: z.string(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");
      const { code } = ctx.req.valid("form");

      const { vendorSettings, session, client } = await initJSXRoute(
        ctx,
        state,
      );
      ctx.set("client_id", client.id);

      if (!session.authParams.username) {
        throw new HTTPException(400, {
          message: "Username not found in state",
        });
      }

      try {
        const user = await validateCode(ctx, {
          client_id: session.authParams.client_id,
          email: session.authParams.username,
          otp: code,
        });
        ctx.set("userName", user.email);
        ctx.set("userId", user.user_id);
        ctx.set("connection", user.connection);
        ctx.set("strategy", "email");
        ctx.set("strategy_type", "passwordless");

        const authResponse = await generateAuthResponse({
          ctx,
          client,
          authParams: session.authParams,
          user,
        });

        return authResponse;
      } catch (err) {
        const user = await getPrimaryUserByEmailAndProvider({
          userAdapter: ctx.env.data.users,
          tenant_id: client.tenant.id,
          email: session.authParams.username,
          provider: "auth2",
        });

        return ctx.html(
          <EnterCodePage
            vendorSettings={vendorSettings}
            error={i18next.t("Wrong email or verification code.")}
            email={session.authParams.username}
            state={state}
            client={client}
            hasPasswordLogin={!!user}
          />,
          400,
        );
      }
    },
  )
  // --------------------------------
  // GET /u/signup
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/signup",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
          code: z.string().optional().openapi({
            description: "The code parameter from an email verification link",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state, code } = ctx.req.valid("query");
      const { vendorSettings, session } = await initJSXRoute(ctx, state);

      const { username } = session.authParams;

      if (!username) {
        throw new HTTPException(400, { message: "Username required" });
      }

      if (code) {
        return ctx.html(
          <SignupPage
            state={state}
            vendorSettings={vendorSettings}
            email={username}
            code={code}
          />,
        );
      }

      return ctx.html(
        <SignupPage
          state={state}
          vendorSettings={vendorSettings}
          email={username}
        />,
      );
    },
  )
  // --------------------------------
  // POST /u/signup
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/signup",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
        body: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: z.object({
                password: z.string(),
                "re-enter-password": z.string(),
                code: z.string().optional(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    //TODO: merge logic with dbconnections/signup
    async (ctx) => {
      const { state } = ctx.req.valid("query");
      const loginParams = ctx.req.valid("form");
      const { env } = ctx;

      const { vendorSettings, client, session } = await initJSXRoute(
        ctx,
        state,
      );

      const connection = "Username-Password-Authentication";
      ctx.set("client_id", client.id);
      ctx.set("connection", connection);

      const email = session.authParams.username;
      if (!email) {
        throw new HTTPException(400, { message: "Username required" });
      }
      ctx.set("userName", email);

      if (loginParams.password !== loginParams["re-enter-password"]) {
        return ctx.html(
          <SignupPage
            state={state}
            code={loginParams.code}
            vendorSettings={vendorSettings}
            error={i18next.t("create_account_passwords_didnt_match")}
            email={session.authParams.username}
          />,
          400,
        );
      }

      if (!validatePassword(loginParams.password)) {
        return ctx.html(
          <SignupPage
            state={state}
            code={loginParams.code}
            vendorSettings={vendorSettings}
            error={i18next.t("create_account_weak_password")}
            email={session.authParams.username}
          />,
          400,
        );
      }

      const emailVerificationCode = loginParams.code
        ? await env.data.codes.get(
            client.tenant.id,
            loginParams.code,
            "email_verification",
          )
        : undefined;
      const emailVerificationSession = emailVerificationCode
        ? await env.data.logins.get(
            client.tenant.id,
            emailVerificationCode.login_id,
          )
        : undefined;

      try {
        const existingUser = await getUserByEmailAndProvider({
          userAdapter: ctx.env.data.users,
          tenant_id: client.tenant.id,
          email,
          provider: "auth2",
        });

        if (existingUser) {
          throw new HTTPException(400, { message: "Invalid sign up" });
        }

        const email_verified =
          emailVerificationSession?.authParams.username === email;

        const newUser = await ctx.env.data.users.create(client.tenant.id, {
          user_id: `auth2|${userIdGenerate()}`,
          email,
          // TODO: this should be set by the adapter
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_verified,
          provider: "auth2",
          connection,
          is_social: false,
          login_count: 0,
        });
        ctx.set("userId", newUser.user_id);

        // fetch the user again to get the user_id of the password user in case they have been linked
        const newPasswordUser = await getUserByEmailAndProvider({
          userAdapter: ctx.env.data.users,
          tenant_id: client.tenant.id,
          email,
          provider: "auth2",
        });

        if (!newPasswordUser) {
          throw new HTTPException(400, { message: "Invalid sign up" });
        }

        await env.data.passwords.create(client.tenant.id, {
          user_id: newPasswordUser.user_id,
          password: await bcryptjs.hash(loginParams.password, 10),
          algorithm: "bcrypt",
        });

        if (!email_verified) {
          await sendEmailVerificationEmail({
            env: ctx.env,
            client,
            user: newUser,
            authParams: session.authParams,
          });

          return ctx.html(
            <MessagePage
              message={i18next.t("validate_email_body")}
              pageTitle={i18next.t("validate_email_title")}
              vendorSettings={vendorSettings}
              state={state}
            />,
          );
        }

        return handleLogin(ctx, newUser, session, client);
      } catch (err: any) {
        const vendorSettings = await fetchVendorSettings(
          env,
          client.id,
          session.authParams.vendor_id,
        );
        return ctx.html(
          <SignupPage
            state={state}
            vendorSettings={vendorSettings}
            error={err.message}
            email={email}
          />,
          400,
        );
      }
    },
  )
  // --------------------------------
  // GET /u/validate-email
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      // TODO: change the route to /u/verify-email
      path: "/validate-email",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
          code: z.string().openapi({
            description: "The code parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state, code } = ctx.req.valid("query");

      const { env } = ctx;

      const { client, session, vendorSettings } = await initJSXRoute(
        ctx,
        state,
      );

      const email = session.authParams.username;
      if (!email) {
        throw new HTTPException(400, {
          message: "Username not found in state",
        });
      }

      const user = await getUserByEmailAndProvider({
        userAdapter: env.data.users,
        tenant_id: client.tenant.id,
        email,
        provider: "auth2",
      });
      if (!user) {
        throw new HTTPException(500, { message: "No user found" });
      }

      const foundCode = await env.data.codes.get(
        client.tenant.id,
        code,
        "email_verification",
      );

      if (!foundCode) {
        throw new HTTPException(400, { message: "Code not found or expired" });
      }

      await env.data.users.update(client.tenant.id, user.user_id, {
        email_verified: true,
      });

      const usersWithSameEmail = await getUsersByEmail(
        env.data.users,
        client.tenant.id,
        email,
      );

      const usersWithSameEmailButNotUsernamePassword =
        usersWithSameEmail.filter((user) => user.provider !== "auth2");

      if (usersWithSameEmailButNotUsernamePassword.length > 0) {
        const primaryUsers = usersWithSameEmailButNotUsernamePassword.filter(
          (user) => !user.linked_to,
        );

        // these cases are currently not handled! if we think they're edge cases and we release this, we should at least inform datadog!
        if (primaryUsers.length > 1) {
          console.error("More than one primary user found for email", email);
        }

        if (primaryUsers.length === 0) {
          console.error("No primary user found for email", email);
          // so here we should ... hope there is only one usersWithSameEmailButNotUsernamePassword
          // and then follow that linked_to chain?
        }

        // now actually link this username-password user to the primary user
        if (primaryUsers.length === 1) {
          await env.data.users.update(client.tenant.id, user.user_id, {
            linked_to: primaryUsers[0].user_id,
          });
        }
      }

      return ctx.html(
        <EmailValidatedPage vendorSettings={vendorSettings} state={state} />,
      );
    },
  )

  // --------------------------------
  // GET /u/info
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/info",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
          code: z.string().openapi({
            description: "The code parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),

    async (ctx) => {
      const vendorSettings = await fetchVendorSettings(ctx.env);
      const { state } = ctx.req.valid("query");

      return ctx.html(
        <MessagePage
          message="Not implemented"
          pageTitle="User info"
          vendorSettings={vendorSettings}
          state={state}
        />,
      );
    },
  )
  // --------------------------------
  // GET /u/check-account
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/check-account",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { env } = ctx;
      const { state } = ctx.req.valid("query");

      const { vendorSettings, client } = await initJSXRoute(ctx, state);

      // Fetch the cookie
      const authCookie = getAuthCookie(
        client.tenant.id,
        ctx.req.header("cookie"),
      );
      const authSession = authCookie
        ? await env.data.sessions.get(client.tenant.id, authCookie)
        : null;

      if (!authSession) {
        return ctx.redirect(`/u/enter-email?state=${state}`);
      }

      const user = await env.data.users.get(
        client.tenant.id,
        authSession.user_id,
      );

      if (!user) {
        return ctx.redirect(`/u/enter-email?state=${state}`);
      }

      return ctx.html(
        <CheckEmailPage
          vendorSettings={vendorSettings}
          state={state}
          user={user}
        />,
      );
    },
  )
  // --------------------------------
  // POST /u/check-account
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/check-account",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
      },
      responses: {
        302: {
          description: "Redirect",
        },
      },
    }),
    async (ctx) => {
      const { env } = ctx;
      const { state } = ctx.req.valid("query");

      const { session, client } = await initJSXRoute(ctx, state);

      // Fetch the cookie
      const authCookie = getAuthCookie(
        client.tenant.id,
        ctx.req.header("cookie"),
      );
      const authSession = authCookie
        ? await env.data.sessions.get(client.tenant.id, authCookie)
        : null;

      if (!authSession) {
        return ctx.redirect(`/u/enter-email?state=${state}`);
      }

      const user = await env.data.users.get(
        client.tenant.id,
        authSession.user_id,
      );

      if (!user) {
        return ctx.redirect(`/u/enter-email?state=${state}`);
      }

      return handleLogin(ctx, user, session, client);
    },
  )
  // --------------------------------
  // GET /u/pre-signup
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/pre-signup",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");
      const { vendorSettings, session } = await initJSXRoute(ctx, state);

      const { username } = session.authParams;

      if (!username) {
        throw new HTTPException(400, { message: "Username required" });
      }

      return ctx.html(
        <PreSignupPage
          state={state}
          vendorSettings={vendorSettings}
          email={username}
        />,
      );
    },
  )
  // --------------------------------
  // POST /u/pre-signup
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/pre-signup",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");
      const { session, client } = await initJSXRoute(ctx, state);

      const { username } = session.authParams;

      if (!username) {
        throw new HTTPException(400, { message: "Username required" });
      }

      const otpCode = await ctx.env.data.codes.create(client.tenant.id, {
        code_id: generateOTP(),
        code_type: "email_verification",
        login_id: session.login_id,
        expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME).toISOString(),
      });

      await sendSignupValidateEmailAddress(
        ctx.env,
        client,
        username,
        otpCode.code_id,
        state,
      );

      return ctx.redirect(`/u/pre-signup-sent?state=${state}`);
    },
  )
  // --------------------------------
  // GET /u/pre-signup-sent
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/pre-signup-sent",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");
      const { vendorSettings, session } = await initJSXRoute(ctx, state);

      const { username } = session.authParams;

      if (!username) {
        throw new HTTPException(400, { message: "Username required" });
      }

      return ctx.html(
        <PreSignupComfirmationPage
          vendorSettings={vendorSettings}
          state={state}
          email={username}
        />,
      );
    },
  );
