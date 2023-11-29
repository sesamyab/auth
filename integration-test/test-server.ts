import { Env } from "../src/types/Env";
import { app } from "../src/app";
import { getCertificate } from "./helpers/token";
import { oAuth2ClientFactory } from "../src/services/oauth2-client";
import createAdapter from "../src/adapters/in-memory";

const data = createAdapter();
// Add a known certificate
data.certificates.upsertCertificates([getCertificate()]);

const server = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // A test endpoint to fetch sent emails
    if (request.url.endsWith("/test/email")) {
      if (!data.email.list) {
        throw new Error('Missing "list" method on email adapter');
      }
      const emails = await data.email.list();
      return new Response(JSON.stringify(emails), {
        headers: { "content-type": "application/json" },
      });
    }

    return app.fetch(
      request,
      // Add dependencies to the environment
      {
        ...env,
        oauth2ClientFactory: { create: oAuth2ClientFactory },
        JWKS_URL: "https://example.com/.well-known/jwks.json",
        ISSUER: "https://example.com/",
        data,
      },
      ctx,
    );
  },
};

export default server;
