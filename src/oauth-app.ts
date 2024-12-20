import { OpenAPIHono } from "@hono/zod-openapi";
import { Env, Var } from "./types";
import { addDataHooks } from "./hooks";
import { CreateAuthParams } from "./app";
import { loginRoutes } from "./routes/universal-login/routes";
import { authorizeRoutes } from "./routes/oauth2/authorize";
import { callbackRoutes } from "./routes/oauth2/callback";
import { authenticateRoutes } from "./routes/oauth2/authenticate";
import { passwordlessRoutes } from "./routes/oauth2/passwordless";

export default function create(params: CreateAuthParams) {
  const app = new OpenAPIHono<{ Bindings: Env; Variables: Var }>();

  app.use(async (ctx, next) => {
    ctx.env.data = addDataHooks(ctx, params.dataAdapter);
    return next();
  });

  const oauthApp = app
    .route("/u", loginRoutes)
    .route("/authorize", authorizeRoutes)
    .route("/callback", callbackRoutes)
    .route("/co/authenticate", authenticateRoutes)
    .route("/passwordless", passwordlessRoutes);

  oauthApp.doc("/spec", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Oauth endpoints",
    },
  });

  return oauthApp;
}
