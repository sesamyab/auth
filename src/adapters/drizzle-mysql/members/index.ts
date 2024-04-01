// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { MembersDataAdapter } from "../../interfaces/Members";
import { listMembers } from "./list";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function createMembersAdapter(
  db: DrizzleMySqlDatabase,
): MembersDataAdapter {
  return {
    list: listMembers(db),
  };
}
