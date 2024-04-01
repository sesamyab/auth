import { and, eq, gt, isNull } from "drizzle-orm";
import { Code, codeSchema } from "../../../types";
import { codes } from "../../../../drizzle-sqlite/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { transformNullsToUndefined } from "../null-to-undefined";

export function list(db: DrizzleSQLiteDatabase) {
  return async (tenant_id: string, user_id: string): Promise<Code[]> => {
    const now = new Date().toISOString();

    const result = await db
      .select()
      .from(codes)
      .where(
        and(
          and(isNull(codes.used_at), gt(codes.expires_at, now)),
          and(eq(codes.tenant_id, tenant_id), eq(codes.user_id, user_id)),
        ),
      );

    return result.map((code) => {
      const { tenant_id, ...rest } = code;
      return codeSchema.parse(transformNullsToUndefined(rest));
    });
  };
}
