// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { applications } from "../../../../drizzle-mysql/schema";
import { eq } from "drizzle-orm";
import { applicationSchema } from "../../../types";
import { DrizzleMysqlDatabase } from "../../../services/drizzle-mysql";

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
