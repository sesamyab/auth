import { keys } from "../../../../drizzle/schema";
import { DrizzleDatabase } from "../../../services/drizzle";
import { Certificate } from "../../../types";

export function create(db: DrizzleDatabase) {
  return async (cert: Certificate) => {
    await db.insert(keys).values(cert).execute();
  };
}
