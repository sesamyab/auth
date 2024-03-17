import { sql } from "drizzle-orm";
import { MySqlSelect } from "drizzle-orm/mysql-core";
import { ListParams } from "../../interfaces/ListParams";

export function withParams<T extends MySqlSelect>(qb: T, params: ListParams) {
  let _qb = qb;

  if (params.sort) {
    _qb = qb.orderBy(
      sql.raw(`${params.sort.sort_by} ${params.sort.sort_order}`),
    );
  }

  return _qb.limit(params.per_page).offset(params.page * params.per_page);
}
