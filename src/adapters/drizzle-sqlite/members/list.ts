import { eq } from "drizzle-orm";
import { members } from "../../../../drizzle-mysql/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { transformNullsToUndefined } from "../null-to-undefined";

export function listMembers(db: DrizzleSQLiteDatabase) {
  return async (tenantId: string) => {
    const result = await db.query.members.findMany({
      where: eq(members.tenant_id, tenantId),
    });

    return {
      members: result.map(transformNullsToUndefined),
    };
  };
}
