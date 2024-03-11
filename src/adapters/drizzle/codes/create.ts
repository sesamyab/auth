import { codes } from "../../../../drizzle/schema";
import { DrizzleDatabase } from "../../../services/drizzle";
import { Code } from "../../../types";

export function create(db: DrizzleDatabase) {
  return async (tenant_id: string, code: Code) => {
    await db
      .insert(codes)
      .values({
        ...code,
        tenant_id,
      })
      .execute();
  };
}
