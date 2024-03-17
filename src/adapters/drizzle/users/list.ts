import { ListUsersResponse } from "../../interfaces/Users";
import { ListParams } from "../../interfaces/ListParams";
import getCountAsInt from "../../../utils/getCountAsInt";
import { luceneFilter } from "../helpers/filter";
import { DrizzleDatabase } from "../../../services/drizzle";
import { eq } from "drizzle-orm";
import { users } from "../../../../drizzle/schema";
import { userSchema } from "../../../types";
import { z } from "zod";
import { withParams } from "../helpers/params";

export function listUsers(db: DrizzleDatabase) {
  return async (
    tenantId: string,
    params: ListParams,
  ): Promise<ListUsersResponse> => {
    const query = db.select().from(users).where(eq(users.tenant_id, tenantId));
    const result = withParams(query.$dynamic(), params);

    // .selectFrom("users").where("users.tenant_id", "=", tenantId);
    if (params.q) {
      // NOTE - this isn't faithful to Auth0 as Auth0 does this in the dashboard - we can filter by any field on the Auth0 mgmt api
      // query = luceneFilter(db, query, params.q, ["email", "name"]);
    }

    // const [{ count }] = await query
    //   .select((eb) => eb.fn.countAll().as("count"))
    //   .execute();

    // const countInt = getCountAsInt(count);

    const parsedUsers = z.array(userSchema).parse(result);

    return {
      users: parsedUsers,
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: 10,
    };
  };
}
