import { sql } from "drizzle-orm";
import { ListParams } from "../../interfaces/ListParams";
import { SQLiteSelect } from "drizzle-orm/sqlite-core";
import { luceneFilterToSQL } from "./filter";

export function withParams<T extends SQLiteSelect>(qb: T, params: ListParams) {
  let _qb = qb;

  if (params.sort) {
    _qb = qb.orderBy(
      sql.raw(`${params.sort.sort_by} ${params.sort.sort_order}`),
    );
  }

  if (params.q) {
    _qb = qb.where(sql.raw(luceneFilterToSQL(params.q, ["email"])));
  }

  return _qb.limit(params.per_page).offset(params.page * params.per_page);
}
