// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { sql } from "drizzle-orm";
import { ListParams } from "../../interfaces/ListParams";
import { MysqlSelect } from "drizzle-orm/mysql-core";
import { luceneFilterToSQL } from "./filter";

export function withParams<T extends MysqlSelect>(qb: T, params: ListParams) {
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
