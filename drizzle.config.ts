import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./drizzle/schema.ts",
  dbCredentials: {
    uri: `mysql://1jxywefik4j5qhj93fj3:pscale_pw_IZzwcRwWAU7xJnLN92dsNZNSadJCw9igGCm1h6W8FxR@aws.connect.psdb.cloud/auth2-dev?ssl={"rejectUnauthorized":true}`,
  },
  driver: "mysql2",
  introspect: {
    casing: "preserve",
  },
} satisfies Config;
