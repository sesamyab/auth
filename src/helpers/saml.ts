import { XMLBuilder, XMLParser } from "fast-xml-parser";
import {
  dsSignatureSchema,
  samlRequestSchema,
  SAMLResponseJSON,
} from "../types/saml";
import { base64 } from "oslo/encoding";
import { X509Certificate } from "@peculiar/x509";
import { pemToBuffer } from "../utils/jwt";
import { nanoid } from "nanoid";
import * as XmlDSigJs from "xmldsigjs";

export interface SAMLResponseParams {
  destination: string;
  inResponseTo: string;
  audience: string;
  issuer: string;
  email: string;
  notBefore?: string;
  notAfter?: string;
  sessionNotOnOrAfter?: string;
  issueInstant?: string;
  assertionId: string;
  sessionIndex: string;
  userId: string;
  signature?: {
    privateKeyPem: string;
    cert: string;
    kid: string;
  };
}

export async function inflateRaw(
  compressedData: Uint8Array,
): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const decompressedStream = new Blob([compressedData])
    .stream()
    .pipeThrough(ds);
  return new Uint8Array(await new Response(decompressedStream).arrayBuffer());
}

export async function inflateDecompress(input: string): Promise<string> {
  const decodedBytes = await base64.decode(input.replace(/ /g, "+"));

  try {
    // Try to decompress using pako
    const decompressed = await inflateRaw(decodedBytes);
    return new TextDecoder().decode(decompressed);
  } catch (error) {
    console.warn(
      "Decompression failed, assuming data is not compressed:",
      error,
    );
    // If decompression fails, assume the data is not compressed
    return new TextDecoder().decode(decodedBytes);
  }
}

export async function parseSamlRequestQuery(samlRequestQuery: string) {
  const samlRequesteXml = await inflateDecompress(samlRequestQuery);

  const parser = new XMLParser({
    attributeNamePrefix: "@_",
    alwaysCreateTextNode: true,
    ignoreAttributes: false,
  });
  const samlRequestJson = parser.parse(samlRequesteXml);

  return samlRequestSchema.parse(samlRequestJson);
}

export async function createSamlResponse(
  samlResponseParams: SAMLResponseParams,
): Promise<string> {
  const notBefore = samlResponseParams.notBefore || new Date().toISOString();
  const notAfter =
    samlResponseParams.notAfter ||
    new Date(new Date(notBefore).getTime() + 60 * 1000).toISOString();
  const issueInstant = samlResponseParams.issueInstant || notBefore;
  const sessionNotOnOrAfter =
    samlResponseParams.sessionNotOnOrAfter || notAfter;
  const responseId = `_${nanoid()}`;

  const samlResponseJson: SAMLResponseJSON = [
    {
      "samlp:Response": [
        {
          "saml:Issuer": [{ "#text": samlResponseParams.issuer }],
        },
        {
          "samlp:Status": [
            {
              "samlp:StatusCode": [],
              ":@": { "@_Value": "urn:oasis:names:tc:SAML:2.0:status:Success" },
            },
          ],
        },
        {
          "saml:Assertion": [
            {
              "saml:Issuer": [
                {
                  "#text": samlResponseParams.issuer,
                },
              ],
            },
            {
              "saml:Subject": [
                {
                  "saml:NameID": [{ "#text": "markus@sesamy.com" }],
                  ":@": {
                    "@_Format":
                      "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
                  },
                },
                {
                  "saml:SubjectConfirmation": [
                    {
                      "saml:SubjectConfirmationData": [],
                      ":@": {
                        "@_InResponseTo": samlResponseParams.inResponseTo,
                        "@_NotOnOrAfter": notAfter,
                        "@_Recipient": samlResponseParams.destination,
                      },
                    },
                  ],
                  ":@": { "@_Method": "urn:oasis:names:tc:SAML:2.0:cm:bearer" },
                },
              ],
            },
            {
              "saml:Conditions": [
                {
                  "saml:AudienceRestriction": [
                    {
                      "saml:Audience": [
                        {
                          "#text": samlResponseParams.audience,
                        },
                      ],
                    },
                  ],
                },
              ],
              ":@": {
                "@_NotBefore": notBefore,
                "@_NotOnOrAfter": notAfter,
              },
            },
            {
              "saml:AuthnStatement": [
                {
                  "saml:AuthnContext": [
                    {
                      "saml:AuthnContextClassRef": [
                        {
                          "#text":
                            "urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified",
                        },
                      ],
                    },
                  ],
                },
              ],
              ":@": {
                "@_AuthnInstant": issueInstant,
                "@_SessionIndex": samlResponseParams.sessionIndex,
                "@_SessionNotOnOrAfter": sessionNotOnOrAfter,
              },
            },
            {
              "saml:AttributeStatement": [
                {
                  "saml:Attribute": [
                    {
                      "saml:AttributeValue": [
                        { "#text": samlResponseParams.userId },
                      ],
                      ":@": {
                        "@_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
                        "@_xmlns:xsi":
                          "http://www.w3.org/2001/XMLSchema-instance",
                        "@_xsi:type": "xs:string",
                      },
                    },
                  ],
                  ":@": {
                    "@_FriendlyName": "persistent",
                    "@_Name": "id",
                    "@_NameFormat":
                      "urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified",
                  },
                },
                {
                  "saml:Attribute": [
                    {
                      "saml:AttributeValue": [{ "#text": "manage-account" }],
                      ":@": {
                        "@_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
                        "@_xmlns:xsi":
                          "http://www.w3.org/2001/XMLSchema-instance",
                        "@_xsi:type": "xs:string",
                      },
                    },
                  ],
                  ":@": {
                    "@_Name": "Role",
                    "@_NameFormat":
                      "urn:oasis:names:tc:SAML:2.0:attrname-format:basic",
                  },
                },
                {
                  "saml:Attribute": [
                    {
                      "saml:AttributeValue": [
                        { "#text": "default-roles-master" },
                      ],
                      ":@": {
                        "@_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
                        "@_xmlns:xsi":
                          "http://www.w3.org/2001/XMLSchema-instance",
                        "@_xsi:type": "xs:string",
                      },
                    },
                  ],
                  ":@": {
                    "@_Name": "Role",
                    "@_NameFormat":
                      "urn:oasis:names:tc:SAML:2.0:attrname-format:basic",
                  },
                },
                {
                  "saml:Attribute": [
                    {
                      "saml:AttributeValue": [{ "#text": "offline_access" }],
                      ":@": {
                        "@_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
                        "@_xmlns:xsi":
                          "http://www.w3.org/2001/XMLSchema-instance",
                        "@_xsi:type": "xs:string",
                      },
                    },
                  ],
                  ":@": {
                    "@_Name": "Role",
                    "@_NameFormat":
                      "urn:oasis:names:tc:SAML:2.0:attrname-format:basic",
                  },
                },
                {
                  "saml:Attribute": [
                    {
                      "saml:AttributeValue": [{ "#text": "view-profile" }],
                      ":@": {
                        "@_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
                        "@_xmlns:xsi":
                          "http://www.w3.org/2001/XMLSchema-instance",
                        "@_xsi:type": "xs:string",
                      },
                    },
                  ],
                  ":@": {
                    "@_Name": "Role",
                    "@_NameFormat":
                      "urn:oasis:names:tc:SAML:2.0:attrname-format:basic",
                  },
                },
                {
                  "saml:Attribute": [
                    {
                      "saml:AttributeValue": [{ "#text": "uma_authorization" }],
                      ":@": {
                        "@_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
                        "@_xmlns:xsi":
                          "http://www.w3.org/2001/XMLSchema-instance",
                        "@_xsi:type": "xs:string",
                      },
                    },
                  ],
                  ":@": {
                    "@_Name": "Role",
                    "@_NameFormat":
                      "urn:oasis:names:tc:SAML:2.0:attrname-format:basic",
                  },
                },
                {
                  "saml:Attribute": [
                    {
                      "saml:AttributeValue": [
                        { "#text": "manage-account-links" },
                      ],
                      ":@": {
                        "@_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
                        "@_xmlns:xsi":
                          "http://www.w3.org/2001/XMLSchema-instance",
                        "@_xsi:type": "xs:string",
                      },
                    },
                  ],
                  ":@": {
                    "@_Name": "Role",
                    "@_NameFormat":
                      "urn:oasis:names:tc:SAML:2.0:attrname-format:basic",
                  },
                },
              ],
            },
          ],
          ":@": {
            "@_xmlns": "urn:oasis:names:tc:SAML:2.0:assertion",
            "@_ID": `_${nanoid()}`,
            "@_IssueInstant": issueInstant,
            "@_Version": "2.0",
          },
        },
      ],
      ":@": {
        "@_xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
        "@_xmlns:saml": "urn:oasis:names:tc:SAML:2.0:assertion",
        "@_Destination": samlResponseParams.destination,
        "@_ID": responseId,
        "@_InResponseTo": samlResponseParams.inResponseTo,
        "@_IssueInstant": issueInstant,
        "@_Version": "2.0",
      },
    },
  ];

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    suppressEmptyNode: true,
    preserveOrder: true,
  });

  if (samlResponseParams.signature) {
    // Extract the Assertion for signing
    const assertion = samlResponseJson[0]["samlp:Response"].find((element) =>
      element.hasOwnProperty("saml:Assertion"),
    );

    if (!assertion) {
      throw new Error("Assertion not found in SAML response");
    }

    const assertionXml = builder.build([assertion]);

    const importedCert = new X509Certificate(samlResponseParams.signature.cert);
    const publicKey = await importedCert.publicKey.export();

    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      pemToBuffer(samlResponseParams.signature.privateKeyPem),
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );

    const xmlDsigJs = new XmlDSigJs.SignedXml();

    const signatureXml = await xmlDsigJs.Sign(
      { name: "RSASSA-PKCS1-v1_5" },
      privateKey,
      XmlDSigJs.Parse(assertionXml),
      {
        keyValue: publicKey,
        references: [{ hash: "SHA-512", transforms: ["enveloped", "c14n"] }],
      },
    );

    const parser = new XMLParser({
      attributeNamePrefix: "@_",
      alwaysCreateTextNode: true,
      ignoreAttributes: false,
      preserveOrder: true,
    });
    const signatureJson = parser.parse(signatureXml.toString());
    const signature = dsSignatureSchema.parse(signatureJson[0]);

    // @ts-ignore
    assertion["saml:Assertion"].splice(1, 0, signature);
  }

  // Generate XML
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>${builder.build(samlResponseJson)}`;

  const encodedResponse = btoa(xmlContent);

  return encodedResponse;
}
