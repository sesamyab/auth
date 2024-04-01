import { UserDataAdapter } from "../../interfaces/Users";
import { create } from "./create";
import { get } from "./get";
import { listUsers } from "./list";
import { remove } from "./remove";
import { update } from "./update";
import { unlink } from "./unlink";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createUsersAdapter(db: DrizzleSQLiteDatabase): UserDataAdapter {
  return {
    create: create(db),
    remove: remove(db),
    get: get(db),
    list: listUsers(db),
    update: update(db),
    // TODO - think about this more when other issues fixed
    unlink: unlink(db),
  };
}
