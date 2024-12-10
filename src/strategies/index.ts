import { Context } from "hono";
import { Connection } from "authhero";
import { Env, Var } from "../types";
import * as apple from "./apple2";
import * as facebook from "./facebook";
import * as google from "./google-oauth2";

export type UserInfo = {
  id: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

export type Strategy = {
  getRedirect: (
    ctx: Context<{ Bindings: Env; Variables: Var }>,
    connection: Connection,
  ) => Promise<{ redirectUrl: string; code: string; codeVerifier?: string }>;
  validateAuthorizationCodeAndGetUser: (
    ctx: Context<{ Bindings: Env; Variables: Var }>,
    connection: Connection,
    code: string,
    codeVerifier?: string,
  ) => Promise<UserInfo>;
};

export const strategies: { [strategy: string]: Strategy } = {
  apple,
  facebook,
  "google-oauth2": google,
};
