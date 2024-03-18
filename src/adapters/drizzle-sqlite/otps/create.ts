import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { otps } from "../../../../drizzle-sqlite/schema";
import { OTP } from "../../../types";

export function create(db: DrizzleSQLiteDatabase) {
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
