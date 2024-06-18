import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./drizzle-mysql/schema.ts",
  dbCredentials: {
    url: `mysql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}?ssl={"rejectUnauthorized":true}`,
  },
  dialect: "mysql",
  introspect: {
    casing: "preserve",
  },
} satisfies Config;
