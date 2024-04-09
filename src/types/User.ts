import { z } from "zod";

export const baseUserSchema = z.object({
  email: z.string(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  nickname: z.string().optional(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
  locale: z.string().optional(),
  linked_to: z.string().optional(),
  profileData: z.string().optional(),
});

export const userInsertSchema = baseUserSchema.extend({
  email_verified: z.boolean(),
  last_ip: z.string().optional(),
  last_login: z.string().optional(),
  login_count: z.number(),
  provider: z.string(),
  connection: z.string(),
  is_social: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
