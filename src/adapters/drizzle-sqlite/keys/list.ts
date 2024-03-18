import { isNull } from "drizzle-orm";
import { keys } from "../../../../drizzle-sqlite/schema";
import { certificateSchema } from "../../../types";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function list(db: DrizzleSQLiteDatabase) {
  return async () => {
    const result = await db
      .select()
      .from(keys)
      .where(isNull(keys.revoked_at))
      .execute();

    return result.map((key) => {
      const { tenant_id, ...rest } = key;

      const certificate = certificateSchema.parse(rest);

      return certificate;
    });
  };
}
