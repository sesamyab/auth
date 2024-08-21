import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { base64 } from "oslo/encoding";
import { HTTPException } from "hono/http-exception";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "@authhero/adapter-interfaces";
import { Env, Var } from "../../types";
import { getClient } from "../../services/clients";
import { UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS } from "../../constants";

async function inflateRaw(compressedData: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const decompressedStream = new Blob([compressedData])
    .stream()
    .pipeThrough(ds);
  return new Uint8Array(await new Response(decompressedStream).arrayBuffer());
}

async function tryInflateDecompress(input: Uint8Array): Promise<string> {
  try {
    // Try to decompress using pako
    const decompressed = await inflateRaw(input);
    return new TextDecoder().decode(decompressed);
  } catch (error) {
    console.warn(
      "Decompression failed, assuming data is not compressed:",
      error,
    );
    // If decompression fails, assume the data is not compressed
    return new TextDecoder().decode(input);
  }
}

function extractIdFromXml(xmlString: string) {
  const regex = /ID=(['"])([^'"]+)\1/;
  const match = xmlString.match(regex);

  if (match && match[2]) {
    return match[2];
  }

  throw new HTTPException(400, {
    message: "Failed to extract ID from SAMLRequest",
  });
}

function extractAssersionConsumeUrlFromXml(xmlString: string) {
  const regex = /AssertionConsumerServiceURL=(['"])([^'"]+)\1/;
  const match = xmlString.match(regex);

  if (match && match[2]) {
    return match[2];
  }

  throw new HTTPException(400, {
    message: "Failed to extract AssertionConsumerServiceURL from SAMLRequest",
  });
}

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

      const issuer = ctx.env.ISSUER;

      const metadata = `<EntityDescriptor entityID="urn:auth2.sesamy.com" xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
    <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <KeyDescriptor use="signing">
            <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
                <X509Data>
                    <X509Certificate>MIIDCTCCAfGgAwIBAgIJLY55kBON5jTHMA0GCSqGSIb3DQEBCwUAMCIxIDAeBgNVBAMTF3Nlc2FteS1kZXYuZXUuYXV0aDAuY29tMB4XDTIxMDcyODEzNDYyNloXDTM1MDQwNjEzNDYyNlowIjEgMB4GA1UEAxMXc2VzYW15LWRldi5ldS5hdXRoMC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCmScwL7541d90Utm1C/rR7fqPBH0ZcsX02y1ZRFLTbThGxiQmdwE1vqzp6UdWg2xLDWkhigZUotSp5zoCZ3Mhjqj8nt+rlah/fszAv/aydQYFxVU0QNZF3W8seBCX/0ivzwf3B1uSixuUiV4fTBK8g8rV+OtTnExnUg0hCXamEQiMDq6VRgA+kO2FyOEp3oKj3dI9GJAAJntfgAHFEpC2CcbpTs4GlTt6uORsJ+vbggQpA+WIUuJvo7WZJ6zZKlJXVofa4Eka0xrixOHEPz6hHLYg2o6AowX2gpIPETc0+eg0gvLJkVisgAD0wfq+dQiXw7mSaYeiNF59XDUEuLqspAgMBAAGjQjBAMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFNlGsUvzGigb7TSPEmVaAyaXv+MNMA4GA1UdDwEB/wQEAwIChDANBgkqhkiG9w0BAQsFAAOCAQEANfKDJSrczRCrfYmMkYRSN8B+yUZqiE/sskV9MYh8jHlj5fzm6P2uwIGFmj8h9JI+/4I4w/7mmSefrv4cx+/20tdOoxDKi8VuNok+Rfwy6DMBrQFmViChW0KD760JAwIiFxepjF83ltzMQ843rhO9II+HajSYk2t3bJ47dMrSW9tCJ+xTeK3agdRWAYEX81JF9Saq+F/38uQUi+i2IPebHqYx2WBC08o9cbAbsCFmovAVpYzAzaG8pZaVTXdOWWqo9L3rGWbBYqgwhSJUd8f1fWUildCcoaeahWEiaAmMxEu2le7M8cVykvyRYG2ffzjj80OIjL2BzrRimkg+nxwJoA==</X509Certificate>
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

      // Step 1: Decode the base64 URL-safe string
      const decodedBytes = await base64.decode(SAMLRequest.replace(/ /g, "+"));

      // Step 2: Try to decompress the decoded data
      const xmlString = await tryInflateDecompress(decodedBytes);

      // Example of a SAMLRequest:
      // <samlp:AuthnRequest
      //  AssertionConsumerServiceURL='https://scplay.skiclassics.com/saml/consume'
      //  Destination='https://keycloak.rejlers-srv01.se/auth/realms/master/protocol/saml'
      //  ForceAuthn='true' ID='_60fe2a33-81fd-4046-99e1-5a2c2633447e'
      //  ID='_60fe2a33-81fd-4046-99e1-5a2c2633447e'
      //  IssueInstant='2024-08-15T23:23:26Z'
      //  Version='2.0' xmlns:saml='urn:oasis:names:tc:SAML:2.0:assertion'
      //  xmlns:samlp='urn:oasis:names:tc:SAML:2.0:protocol'>
      //    <saml:Issuer>https://scplay.skiclassics.com/saml/metadata</saml:Issuer>
      //    <samlp:NameIDPolicy AllowCreate='true' Format='urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'/>
      // </samlp:AuthnRequest>

      // TODO: Validate the client
      // TODO: Validate the SAMLRequest

      // Create a new Login session
      const login = await ctx.env.data.logins.create(client.tenant.id, {
        authParams: {
          client_id: client.id,
          state: extractIdFromXml(xmlString),
          // TODO: Should be SAML
          response_type: AuthorizationResponseType.CODE,
          response_mode: AuthorizationResponseMode.SAML_POST,
          redirect_uri: extractAssersionConsumeUrlFromXml(xmlString),
        },
        expires_at: new Date(
          Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
        ).toISOString(),
      });

      return ctx.redirect(`/u/enter-email?state=${login.login_id}`);
    },
  );
