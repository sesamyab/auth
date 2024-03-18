import { keys } from "../../../../drizzle-mysql/schema";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { Certificate } from "../../../types";

export function create(db: DrizzleMysqlDatabase) {
  return async (cert: Certificate) => {
    await db.insert(keys).values(cert).execute();
  };
}
