import { Context } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { Env } from "./types/Env";
import packageJson from "../package.json";
import swaggerUi from "./routes/swagger-ui";
import loggerMiddleware from "./middlewares/logger";
import renderOauthRedirectHtml from "./routes/oauth2-redirect";
import { validateUrl } from "./utils/validate-redirect-url";
import { Var } from "./types/Var";
import { getResetPassword, postResetPassword } from "./routes/tsx/routes";
import { OpenAPIHono } from "@hono/zod-openapi";
import { applications } from "./routes/management-api/applications";
import { connections } from "./routes/management-api/connections";
import { domains } from "./routes/management-api/domains";
import { registerComponent } from "./middlewares/register-component";
import { tenants } from "./routes/management-api/tenants";
import { wellKnown } from "./routes/tsoa/well-known";
import { users } from "./routes/management-api/users";
import { keys } from "./routes/management-api/keys";
import { logs } from "./routes/management-api/logs";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://login2.sesamy.dev",
  "https://login2.sesamy.dev",
  "https://*.vercel.sesamy.dev",
  "https://login2.sesamy.com",
  "https://appleid.apple.com",
  "https://auth-admin.sesamy.dev",
  "https://auth-admin.sesamy.com",
];

const app = new OpenAPIHono<{ Bindings: Env }>();

app
  .onError((err, ctx) => {
    if (err instanceof HTTPException) {
      // Get the custom response
      return err.getResponse();
    }

    return ctx.text(err.message, 500);
  })
  .use(
    "/*",
    cors({
      origin: (origin) => {
        if (!origin) return "";
        if (validateUrl(ALLOWED_ORIGINS, origin)) {
          return origin;
        }
        return "";
      },
      allowHeaders: [
        "Tenant-Id",
        "Content-Type",
        "Content-Range",
        "Auth0-Client",
        "Authorization",
        "Range",
        "Upgrade-Insecure-Requests",
      ],
      allowMethods: ["POST", "PUT", "GET", "DELETE", "PATCH", "OPTIONS"],
      exposeHeaders: ["Content-Length", "Content-Range"],
      maxAge: 600,
      credentials: true,
    }),
  )
  .use(loggerMiddleware);

registerComponent(app);

app.doc("/spec", (c) => ({
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "API",
  },
  servers: [
    {
      url: new URL(c.req.url).origin,
      description: "Current environment",
    },
  ],
  security: [
    {
      oauth2: ["openid", "email", "profile"],
    },
  ],
}));

app.get("/u/reset-password", getResetPassword);

app.post("/u/reset-password", postResetPassword);

app.get(
  "/css/tailwind.css",
  async (ctx: Context<{ Bindings: Env; Variables: Var }>) => {
    const response = await ctx.env.AUTH_TEMPLATES.get(
      "templates/static/stylesheets/tailwind.css",
    );

    if (!response) {
      throw new Error("Template not found");
    }

    const templateString = await response.text();

    return ctx.text(templateString, 200, {
      "content-type": "text/css",
    });
  },
);

export const tsoaApp = app
  .get("/", async (ctx: Context<{ Bindings: Env; Variables: Var }>) => {
    const url = new URL(ctx.req.url);
    const tenantId = url.hostname.split(".")[0];
    return ctx.json({
      name: tenantId,
      version: packageJson.version,
    });
  })
  .get("/docs", swaggerUi)
  .get("/oauth2-redirect.html", renderOauthRedirectHtml)
  .route("/applications", applications)
  .route("/connections", connections)
  .route("/domains", domains)
  .route("/.well-known", wellKnown)
  .route("/api/v2/tenants", tenants)
  .route("/api/v2/users", users)
  .route("/api/v2/keys/signing", keys)
  .route("/api/v2/logs", logs);

export default app;
