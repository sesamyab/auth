import { z } from "zod";

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  audience: z.string(),
  sender_email: z.string().email(),
  sender_name: z.string(),
  support_url: z.string().url().optional(),
  logo: z.string().url().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  language: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export interface Tenant {
  id: string;
  name: string;
  audience: string;
  sender_email: string;
  sender_name: string;
  support_url?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  language?: string;
  created_at: string;
  updated_at: string;
}
