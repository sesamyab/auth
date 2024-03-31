// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";
import { otps } from "../../../../drizzle-mysql/schema";
import { OTP } from "../../../types";

export function create(db: DrizzleMySqlDatabase) {
  return async (otp: OTP) => {
    const { authParams, ...rest } = otp;

    await db
      .insert(otps)
      .values({
        ...rest,
        ...authParams,
        created_at: rest.created_at.toISOString(),
        expires_at: rest.expires_at.toISOString(),
      })
      .execute();
  };
}
