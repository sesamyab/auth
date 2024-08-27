import { nanoid } from "nanoid";

interface SAMLResponseParams {
  issuer: string;
  recipient: string;
  audience: string;
  userEmail: string;
  nameID: string;
  inResponseTo?: string;
}

export class SAMLResponse {
  private issuer: string;
  private recipient: string;
  private audience: string;
  private nameID: string;
  private notBefore: Date;
  private notOnOrAfter: Date;
  private userEmail: string;
  private inResponseTo?: string;

  constructor(params: SAMLResponseParams) {
    this.issuer = params.issuer;
    this.recipient = params.recipient;
    this.audience = params.audience;
    this.nameID = params.nameID;
    this.notBefore = new Date();
    this.notOnOrAfter = new Date(this.notBefore.getTime() + 5 * 60000); // 5 minutes from now
    this.userEmail = params.userEmail;
    this.inResponseTo = params.inResponseTo;
  }

  generateResponse(): string {
    const responseID = nanoid();
    const assertionID = nanoid();
    const issueInstant = new Date().toISOString();

    return `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                      xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                      ID="${responseID}"
                      Version="2.0"
                      IssueInstant="${issueInstant}"
                      Destination="${this.recipient}"${this.inResponseTo ? ` InResponseTo="${this.inResponseTo}"` : ""}>
        <saml:Issuer>${this.issuer}</saml:Issuer>
        <samlp:Status>
          <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
        </samlp:Status>
        <saml:Assertion xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                        xmlns:xs="http://www.w3.org/2001/XMLSchema"
                        ID="${assertionID}"
                        Version="2.0"
                        IssueInstant="${issueInstant}">
          <saml:Issuer>${this.issuer}</saml:Issuer>
          <saml:Subject>
            <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">${this.userEmail}</saml:NameID>
            <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
              <saml:SubjectConfirmationData NotOnOrAfter="${this.notOnOrAfter.toISOString()}"
                                            Recipient="${this.recipient}"/>
            </saml:SubjectConfirmation>
          </saml:Subject>
          <saml:Conditions NotBefore="${this.notBefore.toISOString()}"
                           NotOnOrAfter="${this.notOnOrAfter.toISOString()}">
            <saml:AudienceRestriction>
              <saml:Audience>${this.audience}</saml:Audience>
            </saml:AudienceRestriction>
          </saml:Conditions>
          <saml:AuthnStatement AuthnInstant="${issueInstant}">
            <saml:AuthnContext>
              <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
            </saml:AuthnContext>
          </saml:AuthnStatement>
          <saml:AttributeStatement>
            <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" 
                            NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">
              <saml:AttributeValue xsi:type="xs:string">${this.userEmail}</saml:AttributeValue>
            </saml:Attribute>
                        <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" 
                            NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">
              <saml:AttributeValue xsi:type="xs:string">${this.nameID}</saml:AttributeValue>
            </saml:Attribute>
          </saml:AttributeStatement>
        </saml:Assertion>
      </samlp:Response>
    `;
  }

  async signResponse(
    xml: string,
    privateKey: CryptoKey,
    publicKey: CryptoKey,
  ): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(xml);

    const signature = await crypto.subtle.sign(
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" },
      },
      privateKey,
      data,
    );

    const signatureBase64 = btoa(
      String.fromCharCode(...new Uint8Array(signature)),
    );

    // Extract the public key in PEM format
    const exportedKey = await crypto.subtle.exportKey("spki", publicKey);
    const exportedKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(exportedKey)),
    );
    const pemPublicKey = `-----BEGIN PUBLIC KEY-----\n${exportedKeyBase64}\n-----END PUBLIC KEY-----`;

    // Insert the signature into the XML
    const signedXml = xml.replace(
      "</saml:Assertion>",
      `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:SignedInfo>
          <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
          <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
          <ds:Reference URI="">
            <ds:Transforms>
              <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
              <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
            </ds:Transforms>
            <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
            <ds:DigestValue>${await this.calculateDigest(xml)}</ds:DigestValue>
          </ds:Reference>
        </ds:SignedInfo>
        <ds:SignatureValue>${signatureBase64}</ds:SignatureValue>
        <ds:KeyInfo>
          <ds:X509Data>
            <ds:X509Certificate>${pemPublicKey}</ds:X509Certificate>
          </ds:X509Data>
        </ds:KeyInfo>
      </ds:Signature></saml:Assertion>`,
    );

    return signedXml;
  }

  async calculateDigest(xml: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(xml);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return btoa(hashHex);
  }

  encodeResponse(xml: string): string {
    return btoa(xml);
  }
}