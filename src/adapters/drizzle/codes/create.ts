import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { codes } from "../../../../drizzle/schema";
import { DrizzleDatabase } from "../../../services/drizzle";
import { Code } from "../../../types";
import { insertInto } from "../helpers/insert";

export function create(db: DrizzleDatabase | DrizzleSQLiteDatabase) {
  return async (tenant_id: string, code: Code) => {
    await insertInto(db, codes)
      .values({
        ...code,
        tenant_id,
      })
      .execute();
  };
}
