import { Client } from "@authhero/adapter-interfaces";
import { getDomainFromEmail } from "../../utils/email";
import { EmailOptions } from "./EmailOptions";

import sendWithMailchannels from "./mailchannels";
import sendWithMailgun from "./mailgun";

export default async function sendEmail(
  client: Client,
  emailOptions: EmailOptions,
) {
  const domainName = getDomainFromEmail(emailOptions.from.email);

  const domain = client.domains.find((d) => d.domain === domainName);

  switch (domain?.email_service) {
    case "mailgun":
      if (!domain.email_api_key) {
        throw new Error("Api key required");
      }

      return sendWithMailgun(emailOptions, domain.email_api_key);
    case "mailchannels":
    default:
      return sendWithMailchannels(emailOptions, domain?.dkim_private_key);
  }
}
