import { and, eq } from "drizzle-orm";
import { Ticket, ticketSchema } from "../../../types";
import { tickets } from "../../../../drizzle-sqlite/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function get(db: DrizzleSQLiteDatabase) {
  return async (tenant_id: string, id: string): Promise<Ticket | null> => {
    const ticket = await db.query.tickets.findFirst({
      where: and(eq(tickets.tenant_id, tenant_id), eq(tickets.id, id)),
    });

    if (!ticket) {
      return null;
    }

    const {
      nonce,
      state,
      scope,
      response_type,
      response_mode,
      redirect_uri,
      ...rest
    } = ticket;

    return ticketSchema.parse({
      ...rest,
      authParams: {
        nonce,
        state,
        scope,
        response_type,
        response_mode,
        redirect_uri,
      },
      created_at: new Date(ticket.created_at),
      expires_at: new Date(ticket.expires_at),
    });
  };
}
