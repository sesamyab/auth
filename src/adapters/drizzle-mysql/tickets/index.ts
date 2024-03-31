// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { TicketsAdapter } from "../../interfaces/Tickets";
import { get } from "./get";
import { create } from "./create";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function createTicketsAdapter(db: DrizzleMySqlDatabase): TicketsAdapter {
  return {
    create: create(db),
    get: get(db),
  };
}
