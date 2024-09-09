import { Context } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import i18next from "i18next";
import { Env, Var } from "./types";
import packageJson from "../package.json";
import swaggerUi from "./routes/swagger-ui";
import loggerMiddleware from "./middlewares/logger";
import renderOauthRedirectHtml from "./routes/oauth2-redirect";
import { validateUrl } from "./utils/validate-redirect-url";
import { tailwindCss } from "./styles/tailwind";
import en from "./localesLogin2/en/default.json";
import it from "./localesLogin2/it/default.json";
import nb from "./localesLogin2/nb/default.json";
import sv from "./localesLogin2/sv/default.json";
import pl from "./localesLogin2/pl/default.json";
import { DataAdapters } from "@authhero/adapter-interfaces";
import createOauthApp from "./oauth-app";
import createManagementApp from "./management-app";
import createSamlApp from "./saml-app";
import * as XmlDSigJs from "xmldsigjs";
import { X509Certificate } from "@peculiar/x509";
import { pemToBuffer } from "./utils/jwt";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

// @ts-ignore
global["DOMParser"] = DOMParser;
// @ts-ignore
global["XMLSerializer"] = XMLSerializer;

XmlDSigJs.Application.setEngine("OpenSSL", crypto);

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

i18next.init({
  resources: {
    en: { translation: en },
    it: { translation: it },
    nb: { translation: nb },
    sv: { translation: sv },
    pl: { translation: pl },
  },
});

export interface CreateAuthParams {
  dataAdapter: DataAdapters;
}

export default function create(params: CreateAuthParams) {
  const rootApp = new OpenAPIHono<{ Bindings: Env; Variables: Var }>();

  const app = rootApp
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
    .use(loggerMiddleware)
    .get("/", async (ctx: Context<{ Bindings: Env; Variables: Var }>) => {
      const url = new URL(ctx.req.url);
      const tenantId = url.hostname.split(".")[0];
      return ctx.json({
        name: tenantId,
        version: packageJson.version,
      });
    });

  const oauthApp = createOauthApp(params);
  const managementApp = createManagementApp(params);
  const samlApp = createSamlApp(params);
  rootApp.route("/", oauthApp).route("/", managementApp).route("/", samlApp);

  app.get(
    "/css/tailwind.css",
    async (ctx: Context<{ Bindings: Env; Variables: Var }>) => {
      const css = tailwindCss;

      return ctx.text(css, 200, {
        "content-type": "text/css; charset=utf-8",
      });
    },
  );

  app.get("/test", async (ctx: Context<{ Bindings: Env; Variables: Var }>) => {
    const privateKeyPem = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC5ULQAhUFAEKiC
PgrdK//5PXIzrViPQFcfhG8oSSzo+Zs7LujyWixyY6Cjt0a7wlvUoaUsekgAXuSA
fWHG0UFMhryhHaSmA0DOvgzeAauhtXSoqjvrkWgyrQDWLJ+AvvIGrrCipjDeBONa
STyHH0CPKbT4UsNt4k0T5xmLX9CcQM2v7Nn3v4v7XsorHxZuZSe8hKfDqoVAfx8J
LYo7WaHdhqTv7zJTPLr7JjfeXBS8/R/0+kxPBDXWhphO2Zboyoc3n9kxT58KoXJb
PVvgmhVcfvq3Cw/KiLZkDrd3aqx1YSGUfyd2qNWlvnJDkLRoEEILoUuodoANtj/9
fBSAx+ZFAgMBAAECggEAGCb+BtFXQz/Ijo0CgnfxGS1afIS7tZPnpvpuOFxtJ4Ic
qrZ+8tMw1snITn4dEGyQ5mIY8naPesjjVCHDRBPSxGQNIpyH8IEdCbT4XVjvYxiQ
t0jUnWuqnmww3zkaor+AMMHE0LYDSXRuoz5HTr8SfXYsmW7D/MbRT+Y/TIx01mBc
k/nMyBGVWqtUfoQFgKUHPoSkm1dyiYKDNcS+dDbz7YMbSaVm5611ru/4GMFrarHk
Np0Y/uek2YquKCyWSlkDnZrE6ag6AqSIEX9NR9267B1gSJ9NUTFWxkPvdk3OhyoL
UVhuPLJF6n1di1voZExUB+QyehQNg8dYk2QVfYlg4wKBgQD3HfmzYeXSnwAyEYUR
dq0CQ3FwOPv6kGm1YGVQW026DjVoYtr7coBLAb+t9VeJlanPCPAP/14yDLL1Gbna
4FpD3UB/uQ4pmihwePgHgtF+8U92coVEH6eRt4F92ZthPDiArPowCxJyWkPZqsxq
oh+gXkHxOnxfj+ZQjXGZ/pFKnwKBgQC/+gONZBJ6IPX5b70dglnI9xAYoHRPpUcJ
5HyDCVHeiOYQql7IDnnzQG2Q4wXjGdvtmNC3pJztBQTniA/w0HzpftYFOPtpJ6+j
hLB0JVjkDI6mD3Sy4aHjyHLbxOJgKLt1Y6sK5dcT3OvXeEd+vcf7B7bUFwOvWtMt
M5Gq8E1ImwKBgHp9VDlTbFzTTYCD6Ka4YZd+oKsUw+n2TT+HcZC8QTHZOyXr4knC
/s6vJjjvJJ3hHpOuBXiYhzNd0hLl1pckn/mFoSPuMZPzgtoFTERE1t0Kde3rZB1Z
Z3E2OayNAZTYCdXWaAkKY/Fkxr8NB1hP1kdikWMmL2Ia7Pm+srG3WoNXAoGAUrPZ
Heszjotui+OYPAMwvMO6mnFdSgZwoRFelnDIZS7iteE/bb3WyXVC/jzfB2PXe/bu
S37N38newAO8okie11Q9zQgsPrPLFY2PGqoQLkY+mclkw78yJ9ftq0GZKEXD5CFo
yQwU6MiujSeS3UXSxhEfsSStALkG6p0hrttQ3+sCgYBul8dx6v03Tgyp6NHRXNCJ
Vubaym7GgjdYr27NtPQhVZNAleFCAS+dbJn8zEfCExygbGk2hQjs5zMhnKPiGD4N
WRNbBLg2UNbW9tQmmcyJfZBgGmIxnovj3MbqtV1SonD9e4Y82n9DMTQVlSBjOuA0
pCEkljeFbyR8ix3vMrbkig==
-----END PRIVATE KEY-----`;

    const cert = `-----BEGIN CERTIFICATE-----
MIIDDjCCAfagAwIBAgIVWWlLME1GMU96NXJLeWF4V0RtRU1RMA0GCSqGSIb3DQEB
CwUAMBExDzANBgNVBAMTBnNlc2FteTAeFw0yNDA4MjYyMTI4MzVaFw0yNTA4MjYy
MTI4MzVaMBExDzANBgNVBAMTBnNlc2FteTCCASIwDQYJKoZIhvcNAQEBBQADggEP
ADCCAQoCggEBALlQtACFQUAQqII+Ct0r//k9cjOtWI9AVx+EbyhJLOj5mzsu6PJa
LHJjoKO3RrvCW9ShpSx6SABe5IB9YcbRQUyGvKEdpKYDQM6+DN4Bq6G1dKiqO+uR
aDKtANYsn4C+8gausKKmMN4E41pJPIcfQI8ptPhSw23iTRPnGYtf0JxAza/s2fe/
i/teyisfFm5lJ7yEp8OqhUB/HwktijtZod2GpO/vMlM8uvsmN95cFLz9H/T6TE8E
NdaGmE7ZlujKhzef2TFPnwqhcls9W+CaFVx++rcLD8qItmQOt3dqrHVhIZR/J3ao
1aW+ckOQtGgQQguhS6h2gA22P/18FIDH5kUCAwEAAaNdMFswEgYDVR0TAQH/BAgw
BgEB/wIBAjAWBgNVHSUBAf8EDDAKBggrBgEFBQcDATAOBgNVHQ8BAf8EBAMCAQYw
HQYDVR0OBBYEFBjrCXJ28aDPGYp8mXFisDrVD3NeMA0GCSqGSIb3DQEBCwUAA4IB
AQCuFzeS+z+22MEldoiKXkhNyBhNhAAKB6DORL+ZQ0IZbSE4xYRVtVij6OJLoxPQ
Q8Rz6S8OOYbjTfUjOg7izAvZaZSfEkvFb0u4OsSdulo5bfTSOovhCLiifGibq+uE
DvHhWHi/Nh62yU8w/Avg8UOaq4RCzD8ZK31aIUTUNLeunHAfbiJda93OG+lwvm8D
0zgepM49JG/oXjfm613ndOAs66WHeCRSilUYacMbsBbJk3gqbE17u10M0YmB2KT1
DgM5iJJ2IyVD3j5dE7dPviGnYyPDg0SNaCNFina6JayBNMS8x0V5sN3ftzjeAZkc
xSLvEEit1h/NAxEtsfh8JXFq
-----END CERTIFICATE-----`;

    const xmlContent =
      '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Destination="https://scplay.skiclassics.com/saml/consume" ID="_7bPjCCKj6cd0eeNwu9d0V" InResponseTo="_3b57fa6a-a8b1-4ae7-a787-4ddb0412610b" IssueInstant="2024-09-07T11:00:52.927Z" Version="2.0"><saml:Issuer>urn:auth2.sesamy.com</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status><saml:Assertion xmlns="urn:oasis:names:tc:SAML:2.0:assertion" ID="_qeWIVY8M3mold4LcVG5_4" IssueInstant="2024-09-07T11:00:52.927Z" Version="2.0"><saml:Issuer>urn:auth2.sesamy.com</saml:Issuer><saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">markus@sesamy.com</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData InResponseTo="_3b57fa6a-a8b1-4ae7-a787-4ddb0412610b" NotOnOrAfter="2024-09-07T11:10:52.927Z" Recipient="https://scplay.skiclassics.com/saml/consume"/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="2024-09-07T11:00:52.927Z" NotOnOrAfter="2024-09-07T11:10:52.927Z"><saml:AudienceRestriction><saml:Audience>https://scplay.skiclassics.com/saml/metadata</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="2024-09-07T11:00:52.927Z" SessionIndex="47614e19-7d5f-4dcf-a3c0-034c465852ac::a2af9228-d8ec-4d2a-9ec6-ed5843ce87f8" SessionNotOnOrAfter="2024-09-07T11:10:52.927Z"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement><saml:AttributeStatement><saml:Attribute FriendlyName="persistent" Name="id" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">6f81f2e7-6fe2-4ae6-a956-96f152a3ce15</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">manage-account</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">default-roles-master</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">offline_access</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">view-profile</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">uma_authorization</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">manage-account-links</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>';

    const importedCert = new X509Certificate(cert);
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      pemToBuffer(privateKeyPem),
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-1",
      },
      false,
      ["sign"],
    );

    const xmlDoc = XmlDSigJs.Parse(xmlContent);

    const assertionNode = xmlDoc.getElementsByTagNameNS(
      "urn:oasis:names:tc:SAML:2.0:assertion",
      "Assertion",
    )[0];

    const assertionId = assertionNode.getAttribute("ID");
    if (!assertionId) {
      throw new Error("Assertion ID not found");
    }

    const keyInfoRef = new XmlDSigJs.Reference(`#${assertionId}`);
    keyInfoRef.Transforms.Add(new XmlDSigJs.Transform("enveloped"));
    keyInfoRef.Transforms.Add(new XmlDSigJs.Transform("exc-c14n"));
    keyInfoRef.DigestMethod.Algorithm =
      "http://www.w3.org/2000/09/xmldsig#sha1";

    const signedXml = new XmlDSigJs.SignedXml();
    signedXml.XmlSignature.SignedInfo.References.Add(keyInfoRef);
    signedXml.XmlSignature.SignedInfo.CanonicalizationMethod.Algorithm =
      "http://www.w3.org/2001/10/xml-exc-c14n#";
    const signatureElement = await signedXml.Sign(
      { name: "RSASSA-PKCS1-v1_5" },
      privateKey,
      assertionNode,
      {
        x509: [importedCert.toString("base64")],
        references: [
          {
            hash: "SHA-1",
            transforms: ["enveloped", "exc-c14n"],
            uri: assertionId,
          },
        ],
      },
    );

    const signatureXml = signatureElement.GetXml();
    if (!signatureXml) {
      throw new Error("Signature element not found");
    }

    // Import the signature element into the original document
    const importedSignatureNode = xmlDoc.importNode(signatureXml!, true);

    // There seems to be a bug in xmldsigjs where the Reference URI can't be set if it starts with a hash
    const referenceElement = importedSignatureNode.getElementsByTagNameNS(
      "http://www.w3.org/2000/09/xmldsig#",
      "Reference",
    )[0];
    referenceElement.setAttribute("URI", `#${assertionId}`);

    const issuerElement = assertionNode.getElementsByTagNameNS(
      "urn:oasis:names:tc:SAML:2.0:assertion",
      "Issuer",
    )[0];

    // Append the signature to the assertion
    assertionNode.insertBefore(
      importedSignatureNode,
      issuerElement.nextSibling,
    );

    return ctx.text(xmlDoc.toString(), {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  });

  app.get("/docs", swaggerUi);
  app.get("/oauth2-redirect.html", renderOauthRedirectHtml);

  return {
    app,
    oauthApp,
    managementApp,
  };
}
