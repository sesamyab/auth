import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { AuthorizationResponseMode } from "authhero";
import { Env, Var } from "../../types";
import { getClient } from "../../services/clients";
import { UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS } from "../../constants";
import { X509Certificate } from "@peculiar/x509";
import { createSamlMetadata, parseSamlRequestQuery } from "../../helpers/saml";

export const samlpRoutes = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
  // --------------------------------
  // GET /samlp/metadata/{application_id}
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["saml"],
      method: "get",
      path: "/metadata/{application_id}",
      request: {
        params: z.object({
          application_id: z.string(),
        }),
      },
      responses: {
        200: {
          description: "Decoded SAML Request",
          content: {
            "text/xml": {
              schema: z.string(),
            },
          },
        },
        400: {
          description: "Bad Request",
        },
      },
    }),
    async (ctx) => {
      const { application_id } = ctx.req.valid("param");

      const client = await getClient(ctx.env, application_id);

      if (!client) {
        throw new HTTPException(404, {
          message: "Client not found",
        });
      }

      const [signingKey] = await ctx.env.data.keys.list();

      if (!signingKey) {
        throw new HTTPException(500, {
          message: "No signing key found",
        });
      }

      const cert = new X509Certificate(signingKey.cert);

      const issuer = ctx.env.ISSUER;

      const metadata = createSamlMetadata({
        entityId: client.addons?.samlp?.audience || client.id,
        cert: cert.toString("base64"),
        assertionConsumerServiceUrl: `${issuer}samlp/${application_id}`,
        singleLogoutServiceUrl: `${issuer}samlp/${application_id}/logout`,
      });

      return new Response(metadata, {
        headers: {
          "Content-Type": "text/xml",
        },
      });
    },
  )
  // --------------------------------
  // GET /samlp/{application_id}
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["saml"],
      method: "get",
      path: "/{application_id}",
      request: {
        query: z.object({
          SAMLRequest: z.string(),
          RelayState: z.string().optional(),
          SigAlg: z.string().optional(),
          Signature: z.string().optional(),
        }),
        params: z.object({
          application_id: z.string(),
        }),
      },
      responses: {
        200: {
          description: "Decoded SAML Request",
          content: {
            "text/xml": {
              schema: z.string(),
            },
          },
        },
        400: {
          description: "Bad Request",
        },
      },
    }),
    async (ctx) => {
      const { application_id } = ctx.req.valid("param");
      const { SAMLRequest, RelayState } = ctx.req.valid("query");

      const client = await getClient(ctx.env, application_id);

      const samlRequest = await parseSamlRequestQuery(SAMLRequest);
      const issuer = samlRequest["samlp:AuthnRequest"]["saml:Issuer"]["#text"];

      // Create a new Login session
      const login = await ctx.env.data.logins.create(client.tenant.id, {
        authParams: {
          client_id: client.id,
          // TODO: A terrible hack to get the vendor_id
          vendor_id: client.id.replace("vimeo-", ""),
          state: JSON.stringify({
            requestId: samlRequest["samlp:AuthnRequest"]["@_ID"],
            relayState: RelayState,
          }),
          response_mode: AuthorizationResponseMode.SAML_POST,
          redirect_uri:
            samlRequest["samlp:AuthnRequest"][
              "@_AssertionConsumerServiceURL"
            ] || "https://auth.sesamy.dev/login/callback",
          audience: issuer,
        },
        expires_at: new Date(
          Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
        ).toISOString(),
      });

      return ctx.redirect(`/u/enter-email?state=${login.login_id}`);
    },
  );
