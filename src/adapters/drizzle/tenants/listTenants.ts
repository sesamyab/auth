import { ListParams } from "../../interfaces/ListParams";
import getCountAsInt from "../../../utils/getCountAsInt";
import { DrizzleDatabase } from "../../../services/drizzle";
import { z } from "zod";
import { tenantSchema } from "../../../types";
import { transformNullsToUndefined } from "../null-to-undefined";

export function listTenants(db: DrizzleDatabase) {
  return async (params: ListParams) => {
    const result = await db.query.tenants.findMany();

    // if (params.sort && params.sort.sort_by) {
    //   const { ref } = db.dynamic;
    //   query = query.orderBy(ref(params.sort.sort_by), params.sort.sort_order);
    // }

    // if (params.q) {
    //   query = query.where((eb) => eb.or([eb("name", "like", `%${params.q}%`)]));
    // }

    // const filteredQuery = query
    //   .offset(params.page * params.per_page)
    //   .limit(params.per_page);

    // const tenants = await filteredQuery.selectAll().execute();

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
