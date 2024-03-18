import { ListParams } from "../../interfaces/ListParams";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { eq, sql } from "drizzle-orm";
import { users } from "../../../../drizzle-mysql/schema";
import { userSchema } from "../../../types";
import { z } from "zod";
import { withParams } from "../helpers/params";
import { transformNullsToUndefined } from "../null-to-undefined";

export function listUsers(db: DrizzleMysqlDatabase) {
  return async (tenantId: string, params: ListParams) => {
    const query = db.select().from(users).where(eq(users.tenant_id, tenantId));
    const result = await withParams(query.$dynamic(), params);

    const parsedResults = z
      .array(userSchema)
      .parse(result.map(transformNullsToUndefined));

    if (!params.include_totals) {
      return {
        users: parsedResults,
      };
    }

    const [totals] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(users);

    return {
      users: parsedResults,
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: totals.count,
    };
  };
}
