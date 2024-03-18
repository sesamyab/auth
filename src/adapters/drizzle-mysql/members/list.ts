import { eq } from "drizzle-orm";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { members } from "../../../../drizzle-mysql/schema";
import { Member } from "../../../types";

export function listMembers(db: DrizzleMysqlDatabase) {
  return async (tenantId: string) => {
    const result = await db.query.members.findMany({
      where: eq(members.tenant_id, tenantId),
    });

    return {
      members: result as Member[],
    };
  };
}
