import "dotenv/config";
import type { Config } from "drizzle-kit";
export default {
  schema: "./drizzle-sqlite/schema.ts",
  out: "./drizzle-sqlite",
  driver: "better-sqlite",
  dbCredentials: {
    url: `db.sqlite`,
  },
} satisfies Config;
