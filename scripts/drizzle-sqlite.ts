import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import createAdapters from "../src/adapters/drizzle-sqlite";
import { create } from "../src/services/rsa-key";
import { nanoid } from "nanoid";

import { getDb } from "../src/services/drizzle-sqlite";

const db = getDb(":memory:");
const data = createAdapters(db);
(async () => {
  await migrate(db, { migrationsFolder: "./drizzle-sqlite" });

  const tenant = await data.tenants.create({
    name: "Default",
    audience: "https://example.com",
    sender_name: "Auth Server",
    sender_email: "login@example.com",
  });

  const newCertificate = await create();
  await data.keys.create(newCertificate);

  const app = await data.applications.create(tenant.id, {
    name: "Default",
    id: "default",
    client_secret: "default",
    allowed_callback_urls: "http://localhost:3000/oauth2-redirect.html",
    allowed_logout_urls: "http://localhost:3000",
    allowed_web_origins: "http://localhost:3000",
    email_validation: "disabled",
  });

  const user = await data.users.create(tenant.id, {
    id: `auth2|${nanoid()}`,
    email: "admin",
    email_verified: true,
    is_social: false,
    login_count: 0,
    last_login: new Date().toISOString(),
    provider: "email",
    connection: "Username-Password-Authentication",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await data.passwords.create(tenant.id, {
    user_id: user.id,
    password: "admin",
  });
})();
