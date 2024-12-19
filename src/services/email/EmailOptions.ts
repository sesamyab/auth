import { EmailProvider } from "authhero/dist/authhero";

interface EmailUser {
  email: string;
  name: string;
}

export interface EmailOptions {
  to: EmailUser[];
  from: EmailUser;
  subject: string;
  content: {
    type: "text/plain" | "text/html";
    value: string;
  }[];
  template: string;
  data: Record<string, any>;
}
