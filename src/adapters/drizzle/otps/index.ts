import { OTPAdapter } from "../../interfaces/OTP";
import { list } from "./list";
import { create } from "./create";
import { DrizzleDatabase } from "../../../services/drizzle";

export function createOTPAdapter(db: DrizzleDatabase): OTPAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
