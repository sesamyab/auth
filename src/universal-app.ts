import { OpenAPIHono } from "@hono/zod-openapi";
import { Env, Var } from "./types";
import { addDataHooks } from "./hooks";
import { CreateAuthParams } from "./app";
import { loginRoutes } from "./routes/universal-login/routes";

export default function create(params: CreateAuthParams) {
  const app = new OpenAPIHono<{ Bindings: Env; Variables: Var }>();

  app.use(async (ctx, next) => {
    ctx.env.data = addDataHooks(ctx, params.dataAdapter);
    return next();
  });

  const oauthApp = app.route("/u", loginRoutes);

  oauthApp.doc("/spec", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Oauth endpoints",
    },
  });

  return oauthApp;
}
