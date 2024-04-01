// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { ConnectionsAdapter } from "../../interfaces/Connections";
import { create } from "./create";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function createConnectionsAdapter(
  db: DrizzleMySqlDatabase,
): ConnectionsAdapter {
  return {
    create: create(db),
  };
}
