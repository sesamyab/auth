import { z } from "zod";

export const baseUserSchema = z.object({
  email: z.string().email(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  nickname: z.string().optional(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
  locale: z.string().optional(),
  linked_to: z.string().optional(),
  profileData: z.string().optional(),
});

export const userSchema = baseUserSchema.extend({
  id: z.string(),
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

export interface BaseUser {
  // TODO - Auth0 requires the id OR the email but for our current usage with durable objects and Sesamy's architecture, we need email!
  email: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  locale?: string;
  linked_to?: string;
  profileData?: string;
}

export interface User extends BaseUser {
  id: string;
  email_verified: boolean;
  last_ip?: string;
  last_login?: string;
  login_count: number;
  provider: string;
  connection: string;
  is_social: boolean;
  created_at: string;
  updated_at: string;
}
