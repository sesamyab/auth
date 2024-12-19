import { SendEmailParams } from "authhero";
import { AwsClient } from "aws4fetch";
import { z } from "@hono/zod-openapi";

export default async function sendSqsEmail(params: SendEmailParams) {
  // Send email using SES
  const sqsSchema = z.object({
    credentials: z.object({
      accessKeyId: z.string(),
      secretAccessKey: z.string(),
      region: z.string(),
    }),
    settings: z.object({
      queueName: z.string(),
      accountId: z.string(),
    }),
  });

  const { credentials, settings } = sqsSchema.parse(params.emailProvider);

  const { accessKeyId, secretAccessKey, region } = credentials;
  const { queueName, accountId } = settings;

  const sqsEndpoint = `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;
  const messageBody = JSON.stringify({
    templateKey: params.template,
    data: {
      subject: params.subject,
      to: params.to,
      from: "markus@sesamy.com",
      vendorName: "SESAMY",
      logo: "https://sesamy.com/logo.png",
      passwordResetTitle: "Password Reset",
      resetPasswordEmailClickToReset:
        "Klicka här för att återställa ditt lösenord",
    },
  });

  const aws = new AwsClient({
    accessKeyId,
    secretAccessKey,
    region: region,
  });

  const formBody = new URLSearchParams();
  formBody.append("Action", "SendMessage");
  formBody.append("MessageBody", messageBody);

  try {
    // Send the POST request
    const response = await aws.fetch(sqsEndpoint, {
      method: "POST",
      body: formBody.toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Parse the response
    if (response.ok) {
      const data = await response.text();
      console.log("Message sent successfully:", data);
    } else {
      console.error("Failed to send message:", await response.text());
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
