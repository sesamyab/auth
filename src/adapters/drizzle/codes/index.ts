import { CodesAdapter } from "../../interfaces/Codes";
import { list } from "./list";
import { create } from "./create";
import { DrizzleDatabase } from "../../../services/drizzle";

export function createCodesAdapter(db: DrizzleDatabase): CodesAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
