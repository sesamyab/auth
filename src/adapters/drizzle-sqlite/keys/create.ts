import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { keys } from "../../../../drizzle-sqlite/schema";
import { Certificate } from "../../../types";

export function create(db: DrizzleSQLiteDatabase) {
  return async (cert: Certificate) => {
    await db.insert(keys).values(cert).execute();
  };
}
