import { applications } from "../../../../drizzle-mysql/schema";
import { eq } from "drizzle-orm";
import { applicationSchema } from "../../../types";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function list(db: DrizzleSQLiteDatabase) {
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
