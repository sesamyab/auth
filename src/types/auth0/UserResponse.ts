import { BaseUser } from "../User";
import { Identity } from "./Identity";
import { Totals } from "./Totals";

export interface PostUsersBody extends BaseUser {
  password?: string;
  // Whether this user will receive a verification email after creation (true) or no email (false). Overrides behavior of email_verified parameter.
  verify_email?: boolean;
  username?: string;
  connection?: string;
  email_verified?: boolean;
}

export interface UserResponse extends BaseUser {
  email: string; // Overriding: email is mandatory in GetUserResponse
  created_at: string;
  updated_at: string;
  identities: Identity[];
  login_count: number;
  multifactor?: string[];
  last_ip?: string;
  last_login?: string;
  user_id: string;
  [key: string]: any;
}

export interface GetUserResponseWithTotals extends Totals {
  users: UserResponse[];
}

// I'll duplicate everything for now and we can de-dupe common types after...
// this might be a lot simpler than I'm expecting
// how to do validation though? Zod right? 8-)
export interface CreateEmailUserParas {}

// hmmmm. I'll come back to this PR
