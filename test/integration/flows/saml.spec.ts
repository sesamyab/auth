import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { getTestServer } from "../helpers/test-server";

describe("SAML", () => {
  it("should get the SAML metadata", async () => {
    const { samlApp, env } = await getTestServer();

    const samlClient = testClient(samlApp, env);
    const response = await samlClient.samlp.metadata[":application_id"].$get({
      param: {
        application_id: "clientId",
      },
    });

    expect(response.status).toBe(200);

    const body = await response.text();

    expect(
      body
        // Remove all the blankspace to ignore formatting differences
        .replace(/\s+/g, "")
        // The cert will be different on each execution
        .replace(/<X509Certificate>.*?<\/X509Certificate>/, "CERT_PLACEHOLDER"),
    ).toEqual(
      ` <EntityDescriptor entityID="https://scplay.skiclassics.com/saml/metadata" xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
   <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
     <KeyDescriptor use="signing">
       <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
         <X509Data>
           CERT_PLACEHOLDER
         </X509Data>
       </KeyInfo>
     </KeyDescriptor>
     <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://example.com/samlp/clientId/logout"/>
     <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://example.com/samlp/clientId/logout"/>
     <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
     <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:persistent</NameIDFormat>
     <NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</NameIDFormat>
     <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://example.com/samlp/clientId"/>
     <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://example.com/samlp/clientId"/>
     <Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" FriendlyName="E-Mail Address" xmlns="urn:oasis:names:tc:SAML:2.0:assertion"/>
     <Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" FriendlyName="Given Name" xmlns="urn:oasis:names:tc:SAML:2.0:assertion"/>
     <Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" FriendlyName="Name" xmlns="urn:oasis:names:tc:SAML:2.0:assertion"/>
     <Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" FriendlyName="Surname" xmlns="urn:oasis:names:tc:SAML:2.0:assertion"/>
     <Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" FriendlyName="Name ID" xmlns="urn:oasis:names:tc:SAML:2.0:assertion"/>
   </IDPSSODescriptor>
 </EntityDescriptor>`
        .replace(/\s+/g, "")
        .replace(/<X509Certificate>.*?<\/X509Certificate>/, "CERT_PLACEHOLDER"),
    );
  });

  it("should authenticate a user with SAML", async () => {
    const { samlApp, oauthApp, env } = await getTestServer();

    const samlClient = testClient(samlApp, env);
    const oauthClient = testClient(oauthApp, env);

    // This is a real SAML request from Vimeo
    const samlRequest =
      "jZJLT8JAFIX/Snez6pNHcdKSNBATEjQG1IUbc5lewsR51LlTkH9vKUFxoXE7Od85J+dOQaBVw6vW78wK31skH1RE6Ly0ZmYNtRrdGt1eCnxaLUu2874hHsckGgXHiN6kUEAkBUXC6vhkF4szx4J5ZycNnLy+Seiysoiwkx6/mCbeS402PFBjnSeNtQQW3FonsO9WMu/aznExL9nrKM2zPE9EOM4HaThM6mEI2eAm3Ixhgjcb2G4Hm05K1OLCkAfjS5Yl2TBMkzAZPyY5H454NnlhwTM66stlUcKCD60M8VOdkrXOcAskiRvQSNwLvq7ulrwTcrgMdI00fzONs94Kq9i0OKl5385N/zOnRg81eCjia7I4X+6+S1rMH6yS4hhUStnDzCF4vAzWTajB/94tjdL+Rdbhtpdy1CBVVdcOiVg8Paf+/CLTTw==";

    // ----------------
    // Initiate the SAML flow
    // ----------------
    const samlLoginResponse = await samlClient.samlp[":application_id"].$get({
      param: {
        application_id: "clientId",
      },
      query: {
        SAMLRequest: samlRequest,
      },
    });

    expect(samlLoginResponse.status).toBe(302);

    const loginRedirect = new URL(
      `https://example.com${samlLoginResponse.headers.get("location")}`,
    );
    expect(loginRedirect.pathname).toEqual("/u/enter-email");
    const state = loginRedirect.searchParams.get("state") as string;
    expect(state).toBeTypeOf("string");

    // ----------------
    // Login with password
    // ----------------
    const enterEmailResponse = await oauthClient.u["enter-email"].$post({
      query: {
        state,
      },
      form: {
        username: "foo@example.com",
      },
    });

    expect(enterEmailResponse.status).toBe(302);

    // ----------------
    // Login with password
    // ----------------
    const loginResponse = await oauthClient.u["enter-password"].$post({
      query: {
        state,
      },
      form: {
        password: "Test1234!",
      },
    });

    // Should render a html page with a javascript form post
    expect(loginResponse.status).toBe(200);

    const body = await loginResponse.text();
    expect(body.replace(/\s+/g, "")).toBe(
      `<!DOCTYPE html>
 <html>
 <body onload="document.forms[0].submit()">
     <noscript>
         <p>Your browser has JavaScript disabled. Please click the button below to continue:</p>
         <input type="submit" value="Continue">
     </noscript>
     <form method="post" action="https://scplay.skiclassics.com/saml/consume">
         <input type="hidden" name="SAMLResponse" value="TW9ja2VkIFNBTUwgUmVzcG9uc2U=" />
     </form>
     <script>
     window.onload = function() {{
         document.forms[0].submit();
     }};
     </script>
 </body>
 </html>`.replace(/\s+/g, ""),
    );

    // Validate the logs
    const { logs } = await env.data.logs.list("tenantId", {
      page: 0,
      per_page: 100,
      include_totals: true,
    });

    const succeesfulLoginLog = logs.find((l) => l.type);
    expect(succeesfulLoginLog).toBeDefined();
  });
});
