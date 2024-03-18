import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { applications } from "../../../../drizzle-mysql/schema";
import { eq } from "drizzle-orm";
import { applicationSchema } from "../../../types";

export function list(db: DrizzleMysqlDatabase) {
  return async (tenantId: string) => {
    const result = await db
      .select()
      .from(applications)
      .where(eq(applications.tenant_id, tenantId));

    const mappedResult = result.map((app) => applicationSchema.parse(app));

    return {
      applications: mappedResult,
    };
  };
}
