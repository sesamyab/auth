// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { isNull } from "drizzle-orm";
import { keys } from "../../../../drizzle-mysql/schema";
import { certificateSchema } from "../../../types";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function list(db: DrizzleMySqlDatabase) {
  return async () => {
    const result = await db
      .select()
      .from(keys)
      .where(isNull(keys.revoked_at))
      .execute();

    return result.map((key) => {
      const { tenant_id, ...rest } = key;

      const certificate = certificateSchema.parse({
        ...rest,
        revoked_at: key.revoked_at ?? undefined,
      });

      return certificate;
    });
  };
}
