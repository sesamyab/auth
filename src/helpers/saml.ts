import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { samlRequestSchema, SAMLResponseJSON } from "../types/saml";
import { base64 } from "oslo/encoding";
import { nanoid } from "nanoid";
import { Context } from "hono";
import { Env, Var } from "../types";

export interface SAMLMetadataParams {
  entityId: string;
  assertionConsumerServiceUrl: string;
  singleLogoutServiceUrl: string;
  cert: string;
}

export interface SAMLResponseParams {
  destination: string;
  inResponseTo: string;
  audience: string;
  issuer: string;
  email: string;
  notBefore?: string;
  notAfter?: string;
  responseId?: string;
  assertionId?: string;
  sessionNotOnOrAfter?: string;
  issueInstant?: string;
  sessionIndex: string;
  userId: string;
  signature?: {
    privateKeyPem: string;
    cert: string;
    kid: string;
  };
  encode?: boolean;
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

export function createSamlMetadata(samlMetadataParams: SAMLMetadataParams) {
  const samlMetadataJSON = [
    {
      ":@": {
        "@_entityID": samlMetadataParams.entityId,
        "@_xmlns": "urn:oasis:names:tc:SAML:2.0:metadata",
      },
      EntityDescriptor: [
        {
          ":@": {
            "@_protocolSupportEnumeration":
              "urn:oasis:names:tc:SAML:2.0:protocol",
          },
          IDPSSODescriptor: [
            {
              ":@": {
                "@_use": "signing",
              },
              KeyDescriptor: [
                {
                  ":@": {
                    "@_xmlns": "http://www.w3.org/2000/09/xmldsig#",
                  },
                  KeyInfo: [
                    {
                      X509Data: [
                        {
                          X509Certificate: [
                            { "#text": samlMetadataParams.cert },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              ":@": {
                "@_Binding":
                  "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
                "@_Location": samlMetadataParams.singleLogoutServiceUrl,
              },
              SingleLogoutService: [],
            },
            {
              ":@": {
                "@_Binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
                "@_Location": samlMetadataParams.singleLogoutServiceUrl,
              },
              SingleLogoutService: [],
            },
            {
              NameIDFormat: [
                {
                  "#text":
                    "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
                },
              ],
            },
            {
              NameIDFormat: [
                {
                  "#text":
                    "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
                },
              ],
            },
            {
              NameIDFormat: [
                {
                  "#text":
                    "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
                },
              ],
            },
            {
              ":@": {
                "@_Binding":
                  "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
                "@_Location": samlMetadataParams.assertionConsumerServiceUrl,
              },
              SingleSignOnService: [],
            },
            {
              ":@": {
                "@_Binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
                "@_Location": samlMetadataParams.assertionConsumerServiceUrl,
              },
              SingleSignOnService: [],
            },
            {
              ":@": {
                "@_Name":
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
                "@_NameFormat":
                  "urn:oasis:names:tc:SAML:2.0:attrname-format:uri",
                "@_FriendlyName": "E-Mail Address",
                "@_xmlns": "urn:oasis:names:tc:SAML:2.0:assertion",
              },
              Attribute: [],
            },
            {
              ":@": {
                "@_Name":
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
                "@_NameFormat":
                  "urn:oasis:names:tc:SAML:2.0:attrname-format:uri",
                "@_FriendlyName": "Given Name",
                "@_xmlns": "urn:oasis:names:tc:SAML:2.0:assertion",
              },
              Attribute: [],
            },
            {
              ":@": {
                "@_Name":
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
                "@_NameFormat":
                  "urn:oasis:names:tc:SAML:2.0:attrname-format:uri",
                "@_FriendlyName": "Name",
                "@_xmlns": "urn:oasis:names:tc:SAML:2.0:assertion",
              },
              Attribute: [],
            },
            {
              ":@": {
                "@_Name":
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
                "@_NameFormat":
                  "urn:oasis:names:tc:SAML:2.0:attrname-format:uri",
                "@_FriendlyName": "Surname",
                "@_xmlns": "urn:oasis:names:tc:SAML:2.0:assertion",
              },
              Attribute: [],
            },
            {
              ":@": {
                "@_Name":
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
                "@_NameFormat":
                  "urn:oasis:names:tc:SAML:2.0:attrname-format:uri",
                "@_FriendlyName": "Name ID",
                "@_xmlns": "urn:oasis:names:tc:SAML:2.0:assertion",
              },
              Attribute: [],
            },
          ],
        },
      ],
    },
  ];

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    suppressEmptyNode: true,
    preserveOrder: true,
    format: true,
  });

  // Generate XML
  return builder.build(samlMetadataJSON);
}

export async function createSamlResponse(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  samlResponseParams: SAMLResponseParams,
): Promise<string> {
  const notBefore = samlResponseParams.notBefore || new Date().toISOString();
  const notAfter =
    samlResponseParams.notAfter ||
    new Date(new Date(notBefore).getTime() + 10 * 60 * 1000).toISOString();
  const issueInstant = samlResponseParams.issueInstant || notBefore;
  const sessionNotOnOrAfter =
    samlResponseParams.sessionNotOnOrAfter || notAfter;
  const responseId = samlResponseParams.responseId || `_${nanoid()}`;
  const assertionId = samlResponseParams.assertionId || `_${nanoid()}`;

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
                  "saml:NameID": [{ "#text": samlResponseParams.email }],
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
                      "saml:AttributeValue": [
                        { "#text": samlResponseParams.email },
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
                    "@_Name": "email",
                    "@_NameFormat":
                      "urn:oasis:names:tc:SAML:2.0:attrname-format:basic",
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
            "@_ID": assertionId,
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

  // Generate XML
  let xmlContent = builder.build(samlResponseJson);

  if (samlResponseParams.signature) {
    xmlContent = await ctx.env.signSAML(
      xmlContent,
      samlResponseParams.signature.privateKeyPem,
      samlResponseParams.signature.cert,
    );
  }

  if (samlResponseParams.encode === false) {
    return xmlContent;
  }

  const encodedResponse = btoa(xmlContent);

  return encodedResponse;
}
