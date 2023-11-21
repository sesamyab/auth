import crypto from "crypto";

interface userIdHashArgs {
  tenantId: string;
  provider: string;
  email: string;
}

/*
The user id's should be a hash of tenant-id, provider and email or social id.
It seems that auth0 uses the social login id directly. Confirm this.
User ids's in general seems to be 24 character hex (except apple...)
*/

function userIdHash({ tenantId, provider, email }: userIdHashArgs): string {
  const hash = crypto.createHash("sha256");
  hash.update(tenantId);
  hash.update(provider);
  hash.update(email);

  return hash.digest("hex");
}
