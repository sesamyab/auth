import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { AuthorizationResponseMode } from "@authhero/adapter-interfaces";
import { Env, Var } from "../../types";
import { getClient } from "../../services/clients";
import { UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS } from "../../constants";
import { X509Certificate } from "@peculiar/x509";
import { parseSamlRequestQuery } from "../../helpers/saml";

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

      const metadata = `<EntityDescriptor entityID="urn:auth2.sesamy.com" xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
    <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <KeyDescriptor use="signing">
            <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
                <X509Data>
                    <X509Certificate>${cert.toString("base64")}</X509Certificate>
                </X509Data>
            </KeyInfo>
        </KeyDescriptor>
        <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${issuer}samlp/${application_id}/logout"/>
        <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${issuer}samlp/${application_id}/logout"/>
        <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
        <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:persistent</NameIDFormat>
        <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</NameIDFormat>
        <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${issuer}samlp/${application_id}"/>
        <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${issuer}samlp/${application_id}"/>
        <Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" FriendlyName="E-Mail Address" xmlns="urn:oasis:names:tc:SAML:2.0:assertion"/>
        <Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" FriendlyName="Given Name" xmlns="urn:oasis:names:tc:SAML:2.0:assertion"/>
        <Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" FriendlyName="Name" xmlns="urn:oasis:names:tc:SAML:2.0:assertion"/>
        <Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" FriendlyName="Surname" xmlns="urn:oasis:names:tc:SAML:2.0:assertion"/>
        <Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" FriendlyName="Name ID" xmlns="urn:oasis:names:tc:SAML:2.0:assertion"/>
    </IDPSSODescriptor>
</EntityDescriptor>`;

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
      const { SAMLRequest } = ctx.req.valid("query");

      const client = await getClient(ctx.env, application_id);

      const samlRequest = await parseSamlRequestQuery(SAMLRequest);
      const issuer = samlRequest["samlp:AuthnRequest"]["saml:Issuer"]["#text"];

      // Create a new Login session
      const login = await ctx.env.data.logins.create(client.tenant.id, {
        authParams: {
          client_id: client.id,
          state: samlRequest["samlp:AuthnRequest"]["@_ID"],
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
