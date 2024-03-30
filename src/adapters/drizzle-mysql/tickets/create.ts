// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { DrizzleMysqlDatabase } from "../../../services/drizzle-mysql";
import { tickets } from "../../../../drizzle-mysql/schema";
import { Ticket } from "../../../types";

export function create(db: DrizzleMysqlDatabase) {
  return async (ticket: Ticket) => {
    const { authParams, ...rest } = ticket;

    const sqlTicket = {
      ...rest,
      ...authParams,
      created_at: ticket.created_at.toISOString(),
      expires_at: ticket.expires_at.toISOString(),
      used_at: null,
    };

    await db.insert(tickets).values(sqlTicket).execute();
  };
}
