import { CodesAdapter } from "../../interfaces/Codes";
import { list } from "./list";
import { create } from "./create";
import { DrizzleDatabase } from "../../../services/drizzle";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createCodesAdapter(
  db: DrizzleDatabase | DrizzleSQLiteDatabase,
): CodesAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
