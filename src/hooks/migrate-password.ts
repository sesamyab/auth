import { getDb } from "../services/db";
import { Env, Migration } from "../types";

const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36";

export async function auth0login(
  migration: Migration,
  username: string,
  password: string,
) {
  const response = await fetch(`https://${migration.domain}/co/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: migration.origin,
      "user-agent": userAgent,
    },
    body: JSON.stringify({
      credential_type: "http://auth0.com/oauth/grant-type/password-realm",
      realm: "Username-Password-Authentication",
      username,
      password,
      client_id: migration.clientId,
    }),
  });

  return response.ok;
}

export async function connectIdLogin(
  migration: Migration,
  username: string,
  password: string,
) {
  const response = await fetch("https://connectid.se/user/programmaticLogin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: migration.origin,
      "user-agent": userAgent,
    },
    body: JSON.stringify({
      credential_type: "http://auth0.com/oauth/grant-type/password-realm",
      realm: "Username-Password-Authentication",
      username,
      password,
      client_id: migration.clientId,
    }),
  });

  return response.ok;
}

export async function migratePasswordHook(
  env: Env,
  tenantId: string,
  username: string,
  password: string,
) {
  const db = getDb(env);

  console.log("Start migration");

  const migrations = await db
    .selectFrom("migrations")
    .where("migrations.tenantId", "=", tenantId)
    .selectAll()
    .execute();

  // const migrations: Migration[] = [{
  //     id: 'id',
  //     provider: 'auth0',
  //     domain: 'auth.sesamy.dev',
  //     clientId: '0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW',
  //     origin: 'https://login2.sesamy.dev',
  //     createdAt: '',
  //     modifiedAt: '',
  //     tenantId: ''
  // }]

  for (const migration of migrations) {
    let profile;

    switch (migration.provider) {
      case "auth0":
        profile = await auth0login(migration, username, password);
        break;
    }

    if (profile) {
      return profile;
    }
  }

  return false;
}
