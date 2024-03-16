import { TicketsAdapter } from "../../interfaces/Tickets";
import { get } from "./get";
import { create } from "./create";
import { DrizzleDatabase } from "../../../services/drizzle";

export function createTicketsAdapter(db: DrizzleDatabase): TicketsAdapter {
  return {
    create: create(db),
    get: get(db),
  };
}
