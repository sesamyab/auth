import { handleUserEvent } from "../handlers/update-user";
import { Env } from "../types/Env";

export enum UserEvent {
  loginSuccess = "LOGIN_SUCCESS",
  loginFailed = "LOGIN_FAILED",
  userCreated = "USER_CREATED",
  userUpdated = "USER_UPDATED",
  userDeleted = "USER_DELETED",
}

export interface UserMessage {
  queue_name: "users";
  email: string;
  user_id: string;
  event: UserEvent;
}

export type QueueMessage = { tenant_id: string } & UserMessage;

export async function sendUserEvent(
  env: Env,
  doId: string,
  user_id: string,
  event: UserEvent,
) {
  const [tenant_id, email] = doId.split("|");

  if (env.USERS_QUEUE) {
    const message: QueueMessage = {
      email,
      tenant_id,
      user_id,
      queue_name: "users",
      event,
    };

    await env.USERS_QUEUE.send(message);
  } else {
    await handleUserEvent(env, tenant_id, email, user_id, event);
  }
}
