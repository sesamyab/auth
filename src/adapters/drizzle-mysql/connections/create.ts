import { CreateConnectionParams } from "../../interfaces/Connections";
import { SqlConnection } from "../../../types";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { connections } from "../../../../drizzle-mysql/schema";

export function create(db: DrizzleMysqlDatabase) {
  return async (
    tenant_id: string,
    params: CreateConnectionParams,
  ): Promise<SqlConnection> => {
    const connection: SqlConnection = {
      // inconsistency - some adapters add these fields, others already receive them...
      //   created_at: new Date().toISOString(),
      //   updated_at: new Date().toISOString(),
      tenant_id,
      ...params,
    };

    await db.insert(connections).values(connection).execute();

    return connection;
  };
}
