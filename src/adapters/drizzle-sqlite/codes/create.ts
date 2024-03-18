import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { codes } from "../../../../drizzle-mysql/schema";
import { Code } from "../../../types";

export function create(db: DrizzleSQLiteDatabase) {
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
