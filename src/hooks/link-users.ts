import { User } from "../types";
import { DataAdapters } from "../adapters/interfaces";
import { getPrimaryUserByEmail } from "../utils/users";
import { link } from "fs";

export function linkUsersHook(data: DataAdapters) {
  return async (tenant_id: string, user: User) => {
    // If the user does not have an email or the email is not verified, return the user
    // if (!user.email || !user.email_verified) {
    if (!user.email) {
      return user;
    }

    // Search for a user with the same email
    const existingUser = await getPrimaryUserByEmail({
      userAdapter: data.users,
      tenant_id,
      email: user.email,
    });

    // If no user with the same email exists, return the user
    if (!existingUser) {
      return user;
    }

    return { ...user, linked_to: existingUser.id };
  };
}
