// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { OTPAdapter } from "../../interfaces/OTP";
import { list } from "./list";
import { create } from "./create";
import { DrizzleMysqlDatabase } from "../../../services/drizzle-mysql";

export function createOTPAdapter(db: DrizzleMysqlDatabase): OTPAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
