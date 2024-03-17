import { DrizzleDatabase } from "../../../services/drizzle";
import { applications } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { applicationSchema } from "../../../types";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { selectFrom } from "../helpers/select";

export function list(db: DrizzleDatabase | DrizzleSQLiteDatabase) {
  return async (tenantId: string) => {
    const result = await selectFrom(db, applications).where(
      eq(applications.tenant_id, tenantId),
    );

    const mappedResult = result.map((app) => applicationSchema.parse(app));

    return {
      applications: mappedResult,
    };
  };
}
