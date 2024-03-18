import { and, eq, gt, isNull } from "drizzle-orm";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { Code, codeSchema } from "../../../types";
import { codes } from "../../../../drizzle-mysql/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { selectFrom } from "../helpers/select";

export function list(db: DrizzleMysqlDatabase | DrizzleSQLiteDatabase) {
  return async (tenant_id: string, user_id: string): Promise<Code[]> => {
    const now = new Date().toISOString();

    const result = await selectFrom(db, codes).where(
      and(
        and(isNull(codes.used_at), gt(codes.expires_at, now)),
        and(eq(codes.tenant_id, tenant_id), eq(codes.user_id, user_id)),
      ),
    );

    return result.map((code) => {
      const { tenant_id, ...rest } = code;
      return codeSchema.parse(rest);
    });
  };
}
