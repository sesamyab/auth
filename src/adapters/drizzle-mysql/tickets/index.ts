// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { TicketsAdapter } from "../../interfaces/Tickets";
import { get } from "./get";
import { create } from "./create";
import { DrizzleMysqlDatabase } from "../../../services/drizzle-mysql";

export function createTicketsAdapter(db: DrizzleMysqlDatabase): TicketsAdapter {
  return {
    create: create(db),
    get: get(db),
  };
}
