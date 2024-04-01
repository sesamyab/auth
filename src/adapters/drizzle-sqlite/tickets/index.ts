import { TicketsAdapter } from "../../interfaces/Tickets";
import { get } from "./get";
import { create } from "./create";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createTicketsAdapter(
  db: DrizzleSQLiteDatabase,
): TicketsAdapter {
  return {
    create: create(db),
    get: get(db),
  };
}
