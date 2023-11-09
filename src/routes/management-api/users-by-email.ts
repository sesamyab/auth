import {
  Controller,
  Get,
  Query,
  Request,
  Route,
  Tags,
  Header,
  Security,
} from "@tsoa/runtime";
import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { NotFoundError } from "../../errors";
import { UserResponse } from "../../types/auth0/UserResponse";

export interface LinkBodyParams {
  provider?: string;
  connection_id?: string;
  link_with: string;
}

@Route("api/v2/users-by-email")
@Tags("management-api")
@Security("oauth2managementApi", [""])
export class UsersByEmailController extends Controller {
  @Get("")
  public async getUserByEmail(
    @Request() request: RequestWithContext,
    @Query("email") userEmail: string,
    @Header("tenant-id") tenantId: string,
  ): Promise<UserResponse> {
    const { env } = request.ctx;

    const db = getDb(env);
    const user = await db
      .selectFrom("users")
      .where("users.tenant_id", "=", tenantId)
      .where("users.email", "=", userEmail)
      .selectAll()
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundError();
    }

    const userResponse: UserResponse = {
      ...user,
      user_id: user.id,
      email_verified: true,
      logins_count: 0,
      last_ip: "",
      last_login: "",
      identities: [],
    };

    return userResponse;
  }
}
