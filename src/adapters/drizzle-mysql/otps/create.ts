import { otps } from "../../../../drizzle-mysql/schema";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { OTP } from "../../../types";

export function create(db: DrizzleMysqlDatabase) {
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
