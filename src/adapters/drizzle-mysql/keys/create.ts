// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";
import { keys } from "../../../../drizzle-mysql/schema";
import { Certificate } from "../../../types";

export function create(db: DrizzleMySqlDatabase) {
  return async (cert: Certificate) => {
    await db.insert(keys).values(cert).execute();
  };
}
