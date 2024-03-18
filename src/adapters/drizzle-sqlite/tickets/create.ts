import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { tickets } from "../../../../drizzle-sqlite/schema";
import { Ticket } from "../../../types";

export function create(db: DrizzleSQLiteDatabase) {
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
