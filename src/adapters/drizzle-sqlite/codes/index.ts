import { CodesAdapter } from "../../interfaces/Codes";
import { list } from "./list";
import { create } from "./create";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createCodesAdapter(db: DrizzleSQLiteDatabase): CodesAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
