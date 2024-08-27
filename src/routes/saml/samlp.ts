import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { base64 } from "oslo/encoding";
import { HTTPException } from "hono/http-exception";
import { AuthorizationResponseMode } from "@authhero/adapter-interfaces";
import { Env, Var } from "../../types";
import { getClient } from "../../services/clients";
import { UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS } from "../../constants";
import { X509Certificate } from "@peculiar/x509";

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

function extractIssuerFromXml(xmlString: string): string {
  const regex = /<saml:Issuer\s*>([^<]+)<\/saml:Issuer>/;
  const match = xmlString.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  throw new HTTPException(400, {
    message: "Failed to extract Issuer from SAMLRequest",
  });
}

function extractEntityIdFromXml(xmlString: string) {
  const regex = /entityID=(['"])([^'"]+)\1/;
  const match = xmlString.match(regex);

  if (match && match[2]) {
    return match[2];
  }

  throw new HTTPException(400, {
    message: "Failed to extract EntityID from SAML metadata",
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

      const issuer = extractIssuerFromXml(xmlString);

      // Example of a SP SAML metadata:
      // <md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" ID="_7b7ed171-8d7a-4ca8-979b-fac1cb5a0c32" entityID="https://skiclassicsplay.vhx.tv/saml/metadata">
      //   <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
      //   <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://skiclassicsplay.vhx.tv/logout" ResponseLocation="https://skiclassicsplay.vhx.tv/logout"/>
      //   <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
      //   <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://skiclassicsplay.vhx.tv/saml/consume" index="0" isDefault="true"/>
      //   </md:SPSSODescriptor>
      // </md:EntityDescriptor>

      // TODO: Validate the client
      // TODO: Validate the SAMLRequest

      // Create a new Login session
      const login = await ctx.env.data.logins.create(client.tenant.id, {
        authParams: {
          client_id: client.id,
          state: extractIdFromXml(xmlString),
          response_mode: AuthorizationResponseMode.SAML_POST,
          redirect_uri: extractAssersionConsumeUrlFromXml(xmlString),
          audience: issuer,
        },
        expires_at: new Date(
          Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
        ).toISOString(),
      });

      return ctx.redirect(`/u/enter-email?state=${login.login_id}`);
    },
  );
