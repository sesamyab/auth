import { Client } from "authhero";
import { getDomainFromEmail } from "../../utils/email";
import { EmailOptions } from "./EmailOptions";
import sendWithMailchannels from "./mailchannels";
import sendWithMailgun from "./mailgun";
import sendWithSqs from "./sqs";
import { Env } from "../../types";

export default async function sendEmail(
  env: Env,
  client: Client,
  emailOptions: EmailOptions,
) {
  const emailProvider = await env.data.emailProviders.get(client.tenant.id);
  if (emailProvider && emailProvider.name === "sesamy") {
    console.log("Sending email with SQS");

    await sendWithSqs({ ...emailOptions, emailProvider });
  } else {
    // Legacy email providers
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
}
