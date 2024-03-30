// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { CreateConnectionParams } from "../../interfaces/Connections";
import { SqlConnection } from "../../../types";
import { connections } from "../../../../drizzle-mysql/schema";
import { DrizzleMysqlDatabase } from "../../../services/drizzle-mysql";

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
