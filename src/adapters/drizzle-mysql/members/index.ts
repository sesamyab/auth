// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { MembersDataAdapter } from "../../interfaces/Members";
import { listMembers } from "./list";
import { DrizzleMysqlDatabase } from "../../../services/drizzle-mysql";

export function createMembersAdapter(
  db: DrizzleMysqlDatabase,
): MembersDataAdapter {
  return {
    list: listMembers(db),
  };
}
