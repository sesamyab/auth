import { ListParams } from "../../interfaces/ListParams";
import { eq, sql } from "drizzle-orm";
import { users } from "../../../../drizzle-sqlite/schema";
import { userSchema } from "../../../types";
import { z } from "zod";
import { withParams } from "../helpers/params";
import { transformNullsToUndefined } from "../null-to-undefined";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { ListUsersResponse } from "../../interfaces/Users";

export function listUsers(db: DrizzleSQLiteDatabase) {
  return async (tenantId: string, params: ListParams) => {
    const query = db.select().from(users).where(eq(users.tenant_id, tenantId));
    const result = await withParams(query.$dynamic(), params);

    const parsedResults = z
      .array(userSchema)
      .parse(result.map(transformNullsToUndefined));

    if (!params.include_totals) {
      return {
        users: parsedResults,
      } as ListUsersResponse;
    }

    const [totals] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(users);

    return {
      users: parsedResults,
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: totals.count,
    } as ListUsersResponse;
  };
}
