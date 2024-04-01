import { ConnectionsAdapter } from "../../interfaces/Connections";
import { create } from "./create";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createConnectionsAdapter(
  db: DrizzleSQLiteDatabase,
): ConnectionsAdapter {
  return {
    create: create(db),
  };
}
