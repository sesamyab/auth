// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { ConnectionsAdapter } from "../../interfaces/Connections";
import { create } from "./create";
import { DrizzleMysqlDatabase } from "../../../services/drizzle-mysql";

export function createConnectionsAdapter(
  db: DrizzleMysqlDatabase,
): ConnectionsAdapter {
  return {
    create: create(db),
  };
}
