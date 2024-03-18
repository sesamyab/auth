import { OTPAdapter } from "../../interfaces/OTP";
import { list } from "./list";
import { create } from "./create";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";

export function createOTPAdapter(db: DrizzleMysqlDatabase): OTPAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
