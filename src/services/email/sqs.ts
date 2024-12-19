import { z } from "@hono/zod-openapi";
import { EmailOptions } from "./EmailOptions";
import { AwsClient } from "aws4fetch";
import { EmailProvider } from "authhero";

export default async function send(
  params: EmailOptions & { emailProvider: EmailProvider },
) {
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
      to: params.to[0].email,
      from: params.from.email,
      fromName: params.from.name,
      ...params.data,
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
