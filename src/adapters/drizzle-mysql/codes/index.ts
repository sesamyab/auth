// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { CodesAdapter } from "../../interfaces/Codes";
import { list } from "./list";
import { create } from "./create";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function createCodesAdapter(db: DrizzleMySqlDatabase): CodesAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
