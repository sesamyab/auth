import { isNull } from "drizzle-orm";
import { keys } from "../../../../drizzle-mysql/schema";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { certificateSchema } from "../../../types";

export function list(db: DrizzleMysqlDatabase) {
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
