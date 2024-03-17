import { ListParams } from "../../interfaces/ListParams";
import getCountAsInt from "../../../utils/getCountAsInt";
import { DrizzleDatabase } from "../../../services/drizzle";
import { z } from "zod";
import { tenantSchema } from "../../../types";
import { transformNullsToUndefined } from "../null-to-undefined";
import { tenants } from "../../../../drizzle/schema";
import { withParams } from "../helpers/params";

export function listTenants(db: DrizzleDatabase) {
  return async (params: ListParams) => {
    const query = db.select().from(tenants);
    const result = await withParams(query.$dynamic(), params);

    // if (!params.include_totals) {
    //   return {
    //     tenants,
    //   };
    // }

    // const [{ count }] = await query
    //   .select((eb) => eb.fn.countAll().as("count"))
    //   .execute();

    // const countInt = getCountAsInt(count);

    return {
      tenants: z
        .array(tenantSchema)
        .parse(result.map(transformNullsToUndefined)),
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: 10,
    };
  };
}
