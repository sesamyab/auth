import { Kysely } from "kysely";
import { BaseUser, Database } from "../../../types";

export function update(db: Kysely<Database>) {
  return async (
    tenant_id: string,
    id: string,
    user: Partial<BaseUser>,
  ): Promise<boolean> => {
    const booleans: any = {};

    Object.keys(user).forEach((key) => {
      const data = user as any;
      if (typeof data[key] === "boolean") {
        data[key] = data[key] ? 1 : 0;
      }
    });

    const results = await db
      .updateTable("users")
      .set({
        ...user,
        ...booleans,
        updated_at: new Date().toISOString(),
      })
      .where("users.tenant_id", "=", tenant_id)
      .where("users.id", "=", id)
      .execute();

    return results.length === 1;
  };
}
