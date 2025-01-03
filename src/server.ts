import { Env } from "./types/Env";
import createApp from "./app";
import { PlanetScaleDialect } from "kysely-planetscale";
import { getDb } from "./services/db";
import sendEmail from "./services/email";
import createAdapters from "@authhero/kysely-adapter";
import { cleanup } from "./handlers/cleanup";
import {
  OnExecuteCredentialsExchangeAPI,
  OnExecuteCredentialsExchangeEvent,
} from "authhero";
import sendSqsEmail from "./email-services/sqs";

const server = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const dialect = new PlanetScaleDialect({
      host: env.DATABASE_HOST,
      username: env.DATABASE_USERNAME,
      password: env.DATABASE_PASSWORD,
      fetch: (opts, init) =>
        fetch(new Request(opts, { ...init, cache: undefined })),
    });
    const db = getDb(dialect);
    const dataAdapter = createAdapters(db);
    const { app } = createApp({
      dataAdapter,
    });

    const signSAML = async (
      xmlContent: string,
      privateKey: string,
      publicCert: string,
    ) => {
      const response = await fetch(env.SAML_SIGN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          xmlContent,
          privateKey,
          publicCert,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sign SAML response: ${response.status}`);
      }

      return response.text();
    };

    return app.fetch(
      request,
      // Add dependencies to the environment
      {
        ...env,
        sendEmail,
        signSAML,
        data: dataAdapter,
        emailProviders: {
          sesamy: sendSqsEmail,
        },
        hooks: {
          onExecuteCredentialsExchange: async (
            event: OnExecuteCredentialsExchangeEvent,
            api: OnExecuteCredentialsExchangeAPI,
          ) => {
            if (event.client.id === "data-processor") {
              api.accessToken.setCustomClaim("roles", "sesamy_admin");
            } else if (event.client.id === "sesamy-elastic") {
              api.accessToken.setCustomClaim("roles", "sesamy_user");
              api.idToken.setCustomClaim("roles", "sesamy_user");
            }
          },
        },
      },
      ctx,
    );
  },
  async scheduled(event: Event, env: Env) {
    const dialect = new PlanetScaleDialect({
      host: env.DATABASE_HOST,
      username: env.DATABASE_USERNAME,
      password: env.DATABASE_PASSWORD,
      fetch: (opts, init) =>
        fetch(new Request(opts, { ...init, cache: undefined })),
    });
    const db = getDb(dialect);

    await cleanup(db);
  },
};

export default server;
