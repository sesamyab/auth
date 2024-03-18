import { MembersDataAdapter } from "../../interfaces/Members";
import { listMembers } from "./list";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createMembersAdapter(
  db: DrizzleSQLiteDatabase,
): MembersDataAdapter {
  return {
    list: listMembers(db),
  };
}
