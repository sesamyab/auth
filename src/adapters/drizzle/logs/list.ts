import { ListParams } from "../../interfaces/ListParams";
import getCountAsInt from "../../../utils/getCountAsInt";
import { luceneFilter } from "../helpers/filter";
import { getLogResponse } from "../../../utils/logs";
import { DrizzleDatabase } from "../../../services/drizzle";
import { logs } from "../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { ListLogsResponse } from "../../../adapters/interfaces/Logs";

export function listLogs(db: DrizzleDatabase) {
  return async (tenantId: string, params: ListParams) => {
    const result = await db.query.logs.findMany({
      where: and(
        eq(logs.tenant_id, tenantId),
        params.q ? luceneFilter(params.q, ["user_id", "ip"]) : undefined,
      ),
    });
    // (eq(logs.tenant_id, tenantId))

    // if (params.q) {
    //   query = luceneFilter(db, query, params.q, ["user_id", "ip"]);
    // }

    // TEMP FIX - hardcoded date desc for now
    // query = query.orderBy("date", "desc");

    // TODO - sorting not implemented anywhere yet
    // if (params.sort && params.sort.sort_by) {
    //   const { ref } = db.dynamic;
    //   query = query.orderBy(ref(params.sort.sort_by), params.sort.sort_order);
    // }

    // const filteredQuery = query
    //   .offset(params.page * params.per_page)
    //   .limit(params.per_page);

    // const result = await filteredQuery.selectAll().execute();

    // const [{ count }] = await query
    //   .select((eb) => eb.fn.countAll().as("count"))
    //   .execute();

    // const countInt = getCountAsInt(count);

    return {
      logs: result,
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: 0,
    } as unknown as ListLogsResponse;
  };
}
