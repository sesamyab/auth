import { UserEvent } from "../services/events";
import { getId, User } from "../models";
import { getDb } from "../services/db";
import { Env, SqlUser, UserTag } from "../types";

export async function handleUserEvent(
  env: Env,
  tenant_id: string,
  email: string,
  user_id: string,
  event: UserEvent,
) {
  switch (event) {
    case UserEvent.userDeleted:
      return deleteUser(env, tenant_id, user_id);
    default:
      return updateUser(env, tenant_id, email);
  }
}

async function deleteUser(env: Env, tenant_id: string, userId: string) {
  const db = getDb(env);

  await db
    .deleteFrom("users")
    .where("tenant_id", "=", tenant_id)
    .where("id", "=", userId)
    .execute();
}

async function updateUser(env: Env, tenant_id: string, email: string) {
  const userId = getId(tenant_id, email);
  const userInstance = User.getInstanceByName(env.USER, userId);
  const profile = await userInstance.getProfile.query();

  if (!profile || !profile.email) {
    console.log("No profile found for user", userId);
    return;
  }

  const db = getDb(env);

  const tags: UserTag[] = profile.connections.map((connection) => ({
    category: "connection",
    name: connection.name,
  }));

  const user: SqlUser = {
    id: profile.id,
    email: profile.email,
    given_name: profile.given_name || "",
    family_name: profile.family_name || "",
    name: profile.name || "",
    nickname: profile.nickname || "",
    picture: profile.picture || "",
    created_at: profile.created_at,
    modified_at: profile.modified_at,
    tags: JSON.stringify(tags),
    tenant_id: tenant_id,
  };

  try {
    await db.insertInto("users").values(user).execute();
  } catch (err: any) {
    if (!err.message.includes("AlreadyExists")) {
      throw err;
    }

    await db.updateTable("users").set(user).where("id", "=", user.id).execute();
  }
}
