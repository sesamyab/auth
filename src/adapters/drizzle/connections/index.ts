import { ConnectionsAdapter } from "../../interfaces/Connections";
import { create } from "./create";
import { DrizzleDatabase } from "../../../services/drizzle";

export function createConnectionsAdapter(
  db: DrizzleDatabase,
): ConnectionsAdapter {
  return {
    create: create(db),
  };
}
