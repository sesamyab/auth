import { otps } from "../../../../drizzle/schema";
import { DrizzleDatabase } from "../../../services/drizzle";
import { OTP } from "../../../types";

export function create(db: DrizzleDatabase) {
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
