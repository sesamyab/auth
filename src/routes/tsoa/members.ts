import {
  Controller,
  Get,
  Post,
  Patch,
  Path,
  Request,
  Route,
  Tags,
  Body,
  SuccessResponse,
  Security,
  Delete,
  Header,
} from "@tsoa/runtime";
import { nanoid } from "nanoid";

import { getDb } from "../../services/db";
import { RequestWithContext } from "../../types/RequestWithContext";
import { AdminUser } from "../../types/sql";
import { parseRange } from "../../helpers/content-range";
import { headers } from "../../constants";

@Route("tenants/{tenantId}/members")
@Tags("members")
export class MigrationsController extends Controller {
  @Get("")
  @Security("oauth2", [])
  public async listMembers(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Header("range") range?: string,
  ): Promise<AdminUser[]> {
    const { ctx } = request;

    const parsedRange = parseRange(range);

    const db = getDb(ctx.env);
    const members = await db
      .selectFrom("admin_users")
      .where("admin_users.tenantId", "=", tenantId)
      .selectAll()
      .offset(parsedRange.from)
      .limit(parsedRange.limit)
      .execute();

    if (parsedRange.entity) {
      this.setHeader(
        headers.contentRange,
        `${parsedRange.entity}=${parsedRange.from}-${parsedRange.to}/${parsedRange.limit}`,
      );
    }

    return members;
  }

  @Get("{id}")
  @Security("oauth2", [])
  public async getMember(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<AdminUser | string> {
    const { ctx } = request;

    const db = getDb(ctx.env);
    const member = await db
      .selectFrom("admin_users")
      .where("admin_users.id", "=", ctx.state.user.sub)
      .where("admin_users.tenantId", "=", tenantId)
      .selectAll()
      .executeTakeFirst();

    if (!member) {
      this.setStatus(404);
      return "Not found";
    }

    return member;
  }

  @Delete("{id}")
  @Security("oauth2", [])
  public async deleteMember(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
  ): Promise<string> {
    const { env } = request.ctx;

    const db = getDb(env);
    await db
      .deleteFrom("admin_users")
      .where("admin_users.tenantId", "=", tenantId)
      .where("admin_users.id", "=", id)
      .execute();

    return "OK";
  }

  @Patch("{id}")
  @Security("oauth2", [])
  public async patchMember(
    @Request() request: RequestWithContext,
    @Path("id") id: string,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Partial<
      Omit<AdminUser, "id" | "tenantId" | "createdAt" | "modifiedAt">
    >,
  ) {
    const { env } = request.ctx;

    const db = getDb(env);
    const member = {
      ...body,
      tenantId,
      modifiedAt: new Date().toISOString(),
    };

    const results = await db
      .updateTable("admin_users")
      .set(member)
      .where("id", "=", id)
      .execute();

    return Number(results[0].numUpdatedRows);
  }

  @Post("")
  @Security("oauth2", [])
  @SuccessResponse(201, "Created")
  public async postMember(
    @Request() request: RequestWithContext,
    @Path("tenantId") tenantId: string,
    @Body()
    body: Omit<AdminUser, "id" | "tenantId" | "createdAt" | "modifiedAt">,
  ): Promise<AdminUser> {
    const { ctx } = request;
    const { env } = ctx;

    const db = getDb(env);

    const member: AdminUser = {
      ...body,
      tenantId,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    await db.insertInto("admin_users").values(member).execute();

    this.setStatus(201);
    return member;
  }
}
