import { TicketsAdapter } from "../../interfaces/Tickets";
import { get } from "./get";
import { create } from "./create";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";

export function createTicketsAdapter(db: DrizzleMysqlDatabase): TicketsAdapter {
  return {
    create: create(db),
    get: get(db),
  };
}
