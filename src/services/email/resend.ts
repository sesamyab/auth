import { EmailOptions } from "./EmailOptions";

export default async function send(emailOptions: EmailOptions, apiKey: string) {
  const apiUrl = `https://api.resend.com/emails`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${apiKey}`);
  headers.set("Content-Type", "application/json");

  const htmlContent = emailOptions.content.find(
    (content) => content.type === "text/html",
  );

  const textContent = emailOptions.content.find(
    (content) => content.type === "text/plain",
  );

  const recipients = emailOptions.to.map((recipient) => recipient.email);

  const body = {
    from: `${emailOptions.from.name} <${emailOptions.from.email}>`,
    to: recipients,
    subject: emailOptions.subject,
    html: htmlContent ? htmlContent.value : undefined,
    text: textContent ? textContent.value : undefined,
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed with status: ${response.status}`);
  }
}
