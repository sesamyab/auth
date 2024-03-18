import { and, eq, gt, isNotNull } from "drizzle-orm";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { OTP, otpSchema } from "../../../types";
import { otps } from "../../../../drizzle-mysql/schema";

export function list(db: DrizzleMysqlDatabase) {
  return async (tenant_id: string, email: string): Promise<OTP[]> => {
    const now = new Date().toISOString();

    const result = await db.query.otps.findMany({
      where: and(
        and(eq(otps.tenant_id, tenant_id), eq(otps.email, email)),
        and(isNotNull(otps.tenant_id), gt(otps.expires_at, now)),
      ),
    });

    return result.map((otp) => {
      const { nonce, state, scope, response_type, redirect_uri, ...rest } = otp;

      return otpSchema.parse({
        ...rest,
        authParams: {
          nonce,
          state,
          scope,
          response_type,
          redirect_uri,
        },
        created_at: new Date(otp.created_at),
        expires_at: new Date(otp.expires_at),
      });
    });
  };
}
