import { MembersDataAdapter } from "../../interfaces/Members";
import { listMembers } from "./list";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";

export function createMembersAdapter(
  db: DrizzleMysqlDatabase,
): MembersDataAdapter {
  return {
    list: listMembers(db),
  };
}
