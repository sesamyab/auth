import { describe, expect, it } from "vitest";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import {
  samlRequestSchema,
  samlResponseJsonSchema,
} from "../../src/types/saml";
import { createSamlResponse, inflateDecompress } from "../../src/helpers/saml";

describe("saml", () => {
  it("should parse nested XML with namespace", () => {
    const parser = new XMLParser({
      attributeNamePrefix: "@_",
      ignoreAttributes: false,
      preserveOrder: true,
    });

    const xml = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Destination="https://scplay.skiclassics.com/saml/consume" ID="ID_861937cd-d050-48d2-bfb2-8749da8f53e3" InResponseTo="_3b57fa6a-a8b1-4ae7-a787-4ddb0412610b" IssueInstant="2024-09-04T12:35:34.555Z" Version="2.0"><saml:Issuer>https://keycloak.rejlers-srv01.se/auth/realms/master</saml:Issuer><dsig:Signature xmlns:dsig="http://www.w3.org/2000/09/xmldsig#"><dsig:SignedInfo><dsig:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/><dsig:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/><dsig:Reference URI="#ID_861937cd-d050-48d2-bfb2-8749da8f53e3"><dsig:Transforms><dsig:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><dsig:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></dsig:Transforms><dsig:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><dsig:DigestValue>Kmjigd7N+IVohdqRcK09Mc5fdHI=</dsig:DigestValue></dsig:Reference></dsig:SignedInfo><dsig:SignatureValue>qGa4JwEwv/QzQZbx1LfXUnS3Tr2nkiaLIgnGnvTnWkKrbJPeo20l/RwT1yt8jfQmAI9s4vrsi7JZfh7u3h33blIYNJUGvoATKC2Ws6gfyqL2VEtE3ni2TsNSg51a5c/fDv0lj4r5AohWaFIiZ0ZRmDLZ+QxigU9nRSXBmV8XXceeMd/3M6Z0O9r3DHT/t50/m4543IkoT+6sB/ObV+icZOAbf0cj/TH4jcTPnVwSLac57kybL/0tqyzN05BfJ6C76ud0rOVeajhDMT6tVi6n763z7p7elto8PFjaVapcTGqUCTq9tDAVE3waKC8FXXdEwdKm+cIWTg7Y1Ip6PPs6Og==</dsig:SignatureValue><dsig:KeyInfo><dsig:KeyName>U929L5xX0hciHKqSazt9h-GL3lX1icMXnieJSHbs0gE</dsig:KeyName><dsig:X509Data><dsig:X509Certificate>MIICmzCCAYMCBgF839oZ1TANBgkqhkiG9w0BAQsFADARMQ8wDQYDVQQDDAZtYXN0ZXIwHhcNMjExMTAyMDg1MTI1WhcNMzExMTAyMDg1MzA1WjARMQ8wDQYDVQQDDAZtYXN0ZXIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC8Od3cA0+2NJH9et4ENxcc0B3Gkv8k8MPz0aTH74Hnb7QNTxVZ4SNqym8NOJMG0wiBQeWH4QIosxPVtoxv+gZ6hfBz1KevkkkpCahoA9Q69FQmY5KwiIJd7/4PKGGsZTQeGfcjf/Erax98KX9XagAR5meMQXt1c2eDoc203eFbhmM0zAZZaTpoVagVAbWmgf8StXa1kgmtohZjqPcF46vVDtaMtXgnyXIKgZoslgP4ifGzqEMh7HXwQ/w5SnrbJeq9gjgdv/wtjj9dAW46NxDeiKfwNhHrWFeTj+517TT4kqcn+R49D1/Fz5X6oBSoYgdOKN4ue7HF36bMLoe0MruPAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAAA6IN+opXNquoZpJvyJSgIyms1hAAFA5hbAsiryYKFj6RfPJFcaksoCV/xJf/99A6Imzc3X2sbTTH0F3Qy3kgjWvHf6yRSeBvyh5h+p6Sy2Q96lqaO93Ni7g/Es38Tejssv48WrN/ZnPq8EFRfv+ZonUA5IfieCqvT12qq+uQTrZB4RRtw184EKSk0/QmkUvQmUY/V/3SzgZRggoRZdH0hMi7WGnLr0K/E22f5DaZwQG6mhztIjVJk6yTwC8Vk/E/NYmbVVNK1oPbFXJjIJxLTlxyHAH5TWAPda1EdvJFRSTiJtZs9jFP9J+0mUXjd/ses6dD4C7mmIbU+Ao2EJnhE=</dsig:X509Certificate></dsig:X509Data><dsig:KeyValue><dsig:RSAKeyValue><dsig:Modulus>vDnd3ANPtjSR/XreBDcXHNAdxpL/JPDD89Gkx++B52+0DU8VWeEjaspvDTiTBtMIgUHlh+ECKLMT1baMb/oGeoXwc9Snr5JJKQmoaAPUOvRUJmOSsIiCXe/+DyhhrGU0Hhn3I3/xK2sffCl/V2oAEeZnjEF7dXNng6HNtN3hW4ZjNMwGWWk6aFWoFQG1poH/ErV2tZIJraIWY6j3BeOr1Q7WjLV4J8lyCoGaLJYD+Inxs6hDIex18EP8OUp62yXqvYI4Hb/8LY4/XQFuOjcQ3oin8DYR61hXk4/ude00+JKnJ/kePQ9fxc+V+qAUqGIHTijeLnuxxd+mzC6HtDK7jw==</dsig:Modulus><dsig:Exponent>AQAB</dsig:Exponent></dsig:RSAKeyValue></dsig:KeyValue></dsig:KeyInfo></dsig:Signature><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status><saml:Assertion xmlns="urn:oasis:names:tc:SAML:2.0:assertion" ID="ID_19faa9ca-b02c-4e66-b679-d4e83b9bc05d" IssueInstant="2024-09-04T12:35:34.555Z" Version="2.0"><saml:Issuer>https://keycloak.rejlers-srv01.se/auth/realms/master</saml:Issuer><saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">markus@sesamy.com</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData InResponseTo="_3b57fa6a-a8b1-4ae7-a787-4ddb0412610b" NotOnOrAfter="2024-09-04T12:36:32.555Z" Recipient="https://scplay.skiclassics.com/saml/consume"/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="2024-09-04T12:35:32.555Z" NotOnOrAfter="2024-09-04T12:36:32.555Z"><saml:AudienceRestriction><saml:Audience>https://scplay.skiclassics.com/saml/metadata</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="2024-09-04T12:35:34.555Z" SessionIndex="47614e19-7d5f-4dcf-a3c0-034c465852ac::a2af9228-d8ec-4d2a-9ec6-ed5843ce87f8" SessionNotOnOrAfter="2024-09-04T12:36:34.555Z"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement><saml:AttributeStatement><saml:Attribute FriendlyName="persistent" Name="id" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">6f81f2e7-6fe2-4ae6-a956-96f152a3ce15</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">manage-account</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">default-roles-master</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">offline_access</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">view-profile</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">uma_authorization</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">manage-account-links</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>`;

    const xmlJson = parser.parse(xml);
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      preserveOrder: true,
      // This closes the empty nodes
      suppressEmptyNode: true,
    });

    const xmlString = builder.build(xmlJson);

    expect(xmlString).toBe(xml);
  });

  describe("samlResponse", () => {
    it("should parse a saml request", async () => {
      const samlRequestQuery =
        "jZLJTsMwFEV/JTuvEicpaYrVVIpaIVUqCDEt2KCH8xCmHoKfA/TvcVNVwALE1rrD8bXnBEb3oh3Cs73C1wEpJC0R+qCcXTpLg0F/jf5NSby92jTsOYSeBOckew27jLZKaiBSkjLpDN/HcXnwsWQV45SFfdaXc4s7qR1sM48vGj2l5N/yIiPkECm4R9CGuAEK6HnvXXDS6TGYJWfOSxxhGxb8ECvWq4Y9FCXU1WxWpvlpAelJlU/TWVXXKUym0xpOJ7J7LKKUaMC1pQA2NKzMy5OoT/PqpszFZCaq+p4ldxFopC2znCUfRlsS++qGDd4KB6RIWDBIIkhx3Z5vRBQKOC723dL/7TnejC3me7UY6fziP/saDNBBgDn/7pwfnvIiNq1Xl04ruUtard37Mk4a8DhYnNBA+J2tyIrxRHXp0ygVaEDptus8EjG+OLT+/DOLTw==";

      const samlRequesteXml = await inflateDecompress(samlRequestQuery);

      const parser = new XMLParser({
        attributeNamePrefix: "@_",
        alwaysCreateTextNode: true,
        ignoreAttributes: false,
      });
      const samlRequestJson = parser.parse(samlRequesteXml);

      const samlRequest = samlRequestSchema.parse(samlRequestJson);

      expect(samlRequest).toEqual({
        "samlp:AuthnRequest": {
          "@_AssertionConsumerServiceURL":
            "https://scplay.skiclassics.com/saml/consume",
          "@_Destination":
            "https://keycloak.rejlers-srv01.se/auth/realms/master/protocol/saml",
          "@_ForceAuthn": true,
          "@_ID": "_12a75882-091a-4506-8577-a3667a93cdb1",
          "@_IssueInstant": "2024-09-05T20:38:57Z",
          "@_Version": "2.0",
          "@_xmlns:saml": "urn:oasis:names:tc:SAML:2.0:assertion",
          "@_xmlns:samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
          "saml:Issuer": {
            "#text": "https://scplay.skiclassics.com/saml/metadata",
          },
        },
      });
    });
  });

  describe("samlResponse", () => {
    it("should create a Saml Response", async () => {
      const expectedSamlResponseXml = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Destination="https://scplay.skiclassics.com/saml/consume" ID="ID_861937cd-d050-48d2-bfb2-8749da8f53e3" InResponseTo="_3b57fa6a-a8b1-4ae7-a787-4ddb0412610b" IssueInstant="2024-09-04T12:35:34.555Z" Version="2.0"><saml:Issuer>https://keycloak.rejlers-srv01.se/auth/realms/master</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status><saml:Assertion xmlns="urn:oasis:names:tc:SAML:2.0:assertion" ID="ID_19faa9ca-b02c-4e66-b679-d4e83b9bc05d" IssueInstant="2024-09-04T12:35:34.555Z" Version="2.0"><saml:Issuer>https://keycloak.rejlers-srv01.se/auth/realms/master</saml:Issuer><saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">markus@sesamy.com</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData InResponseTo="_3b57fa6a-a8b1-4ae7-a787-4ddb0412610b" NotOnOrAfter="2024-09-04T12:36:32.555Z" Recipient="https://scplay.skiclassics.com/saml/consume"/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="2024-09-04T12:35:32.555Z" NotOnOrAfter="2024-09-04T12:36:32.555Z"><saml:AudienceRestriction><saml:Audience>https://scplay.skiclassics.com/saml/metadata</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="2024-09-04T12:35:34.555Z" SessionIndex="47614e19-7d5f-4dcf-a3c0-034c465852ac::a2af9228-d8ec-4d2a-9ec6-ed5843ce87f8" SessionNotOnOrAfter="2024-09-04T12:36:34.555Z"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement><saml:AttributeStatement><saml:Attribute FriendlyName="persistent" Name="id" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">6f81f2e7-6fe2-4ae6-a956-96f152a3ce15</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">manage-account</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">default-roles-master</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">offline_access</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">view-profile</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">uma_authorization</saml:AttributeValue></saml:Attribute><saml:Attribute Name="Role" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">manage-account-links</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>`;

      const samlResponseXml = await createSamlResponse({
        destination: "https://scplay.skiclassics.com/saml/consume",
        inResponseTo: "_3b57fa6a-a8b1-4ae7-a787-4ddb0412610b",
        audience: "https://scplay.skiclassics.com/saml/metadata",
        issuer: "https://keycloak.rejlers-srv01.se/auth/realms/master",
        email: "markus@sesamy.com",
        issueInstant: "2024-09-04T12:35:34.555Z",
        notBefore: "2024-09-04T12:35:32.555Z",
        responseId: "ID_861937cd-d050-48d2-bfb2-8749da8f53e3",
        assertionId: "ID_19faa9ca-b02c-4e66-b679-d4e83b9bc05d",
        notAfter: "2024-09-04T12:36:32.555Z",
        sessionNotOnOrAfter: "2024-09-04T12:36:34.555Z",
        sessionIndex:
          "47614e19-7d5f-4dcf-a3c0-034c465852ac::a2af9228-d8ec-4d2a-9ec6-ed5843ce87f8",
        userId: "6f81f2e7-6fe2-4ae6-a956-96f152a3ce15",
        encode: false,
        samlSignUrl: "",
      });

      const arrayNodes = ["saml:Attribute"];

      const parser = new XMLParser({
        attributeNamePrefix: "@_",
        alwaysCreateTextNode: true,
        ignoreAttributes: false,
        preserveOrder: true,
        isArray: (name: string) => {
          return arrayNodes.includes(name);
        },
      });
      const sampResponseJson = parser.parse(samlResponseXml);
      const samlRepsonseData = samlResponseJsonSchema.parse(sampResponseJson);

      const expectedSamlResponseXmlJson = parser.parse(expectedSamlResponseXml);
      expect(samlRepsonseData).toEqual(expectedSamlResponseXmlJson);
    });
  });
});
