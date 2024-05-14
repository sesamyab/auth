import { User } from "../types";
import { DataAdapters } from "../adapters/interfaces";
import { linkUsersHook } from "./link-users";

function createUserHooks(data: DataAdapters) {
  return async (tenant_id: string, user: User) => {
    let updatedUser = await linkUsersHook(data)(tenant_id, user);

    const result = await data.users.create(tenant_id, updatedUser);

    return result;
  };
}

export function addDataHooks(data: DataAdapters) {
  return { ...data, users: { ...data.users, create: createUserHooks } };
}
