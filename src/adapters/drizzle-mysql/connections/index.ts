import { ConnectionsAdapter } from "../../interfaces/Connections";
import { create } from "./create";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";

export function createConnectionsAdapter(
  db: DrizzleMysqlDatabase,
): ConnectionsAdapter {
  return {
    create: create(db),
  };
}
