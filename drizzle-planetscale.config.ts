import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./drizzle/schema.ts",
  dbCredentials: {
    uri: `mysql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@aws.connect.psdb.cloud/auth2-dev?ssl={"rejectUnauthorized":true}`,
  },
  driver: "mysql2",
  introspect: {
    casing: "preserve",
  },
} satisfies Config;
