import { Context } from "cloudworker-router";
import { Env } from "../types";

export function hasReadPermission(ctx: Context<Env>) {
  return (
    ctx.env.READ_PERMISSION &&
    ctx.state.user.permissions.include(ctx.env.READ_PERMISSION)
  );
}

export function hasWritePermission(ctx: Context<Env>) {
  return (
    ctx.env.WRITE_PERMISSION &&
    ctx.state.user.permissions.include(ctx.env.WRITE_PERMISSION)
  );
}
