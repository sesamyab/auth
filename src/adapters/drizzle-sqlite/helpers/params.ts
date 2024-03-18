import { sql } from "drizzle-orm";
import { ListParams } from "../../interfaces/ListParams";
import { SQLiteSelect } from "drizzle-orm/sqlite-core";

export function withParams<T extends SQLiteSelect>(qb: T, params: ListParams) {
  let _qb = qb;

  if (params.sort) {
    _qb = qb.orderBy(
      sql.raw(`${params.sort.sort_by} ${params.sort.sort_order}`),
    );
  }

  return _qb.limit(params.per_page).offset(params.page * params.per_page);
}
