import { eq } from "drizzle-orm";
import { DrizzleDatabase } from "../../../services/drizzle";
import { members } from "../../../../drizzle/schema";
import { Member } from "../../../types";

export function listMembers(db: DrizzleDatabase) {
  return async (tenantId: string) => {
    const result = await db.query.members.findMany({
      where: eq(members.tenant_id, tenantId),
    });

    return {
      members: result as Member[],
    };
  };
}
