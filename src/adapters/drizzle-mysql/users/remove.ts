// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { users } from "../../../../drizzle-mysql/schema";
import { and, eq } from "drizzle-orm";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function remove(db: DrizzleMySqlDatabase) {
  return async (tenant_id: string, id: string): Promise<boolean> => {
    await db
      .delete(users)
      .where(and(eq(users.tenant_id, tenant_id), eq(users.id, id)))
      .execute();

    return true;
  };
}
