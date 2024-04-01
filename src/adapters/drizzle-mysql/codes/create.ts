// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";
import { codes } from "../../../../drizzle-mysql/schema";
import { Code } from "../../../types";

export function create(db: DrizzleMySqlDatabase) {
  return async (tenant_id: string, code: Code) => {
    await db
      .insert(codes)
      .values({
        ...code,
        tenant_id,
      })
      .execute();
  };
}
