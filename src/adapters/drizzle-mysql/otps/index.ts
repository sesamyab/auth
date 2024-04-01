// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { OTPAdapter } from "../../interfaces/OTP";
import { list } from "./list";
import { create } from "./create";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function createOTPAdapter(db: DrizzleMySqlDatabase): OTPAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
