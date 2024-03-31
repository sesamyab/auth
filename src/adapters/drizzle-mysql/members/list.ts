// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { eq } from "drizzle-orm";
import { members } from "../../../../drizzle-mysql/schema";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";
import { transformNullsToUndefined } from "../null-to-undefined";

export function listMembers(db: DrizzleMySqlDatabase) {
  return async (tenantId: string) => {
    const result = await db.query.members.findMany({
      where: eq(members.tenant_id, tenantId),
    });

    return {
      members: result.map(transformNullsToUndefined),
    };
  };
}
