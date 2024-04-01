import { OTPAdapter } from "../../interfaces/OTP";
import { list } from "./list";
import { create } from "./create";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createOTPAdapter(db: DrizzleSQLiteDatabase): OTPAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
