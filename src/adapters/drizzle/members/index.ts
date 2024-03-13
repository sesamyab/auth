import { MembersDataAdapter } from "../../interfaces/Members";
import { listMembers } from "./list";
import { DrizzleDatabase } from "../../../services/drizzle";

export function createMembersAdapter(db: DrizzleDatabase): MembersDataAdapter {
  return {
    list: listMembers(db),
  };
}
