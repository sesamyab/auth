// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { DrizzleMysqlDatabase } from "../../../services/drizzle-mysql";
import { keys } from "../../../../drizzle-mysql/schema";
import { Certificate } from "../../../types";

export function create(db: DrizzleMysqlDatabase) {
  return async (cert: Certificate) => {
    await db.insert(keys).values(cert).execute();
  };
}
