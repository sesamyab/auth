import { nanoid } from "nanoid";
import { SqlLog, Log } from "../../../types";
import { logs } from "../../../../drizzle-sqlite/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

function stringifyIfTruthy<T>(value: T | undefined): string | undefined {
  return value ? JSON.stringify(value) : undefined;
}

function flattenScopesIfArray(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value.join(",");
  }

  return value;
}

function getAuth0ClientValue(log: Log): string | undefined {
  if (
    log.type === "seccft" ||
    log.type === "scoa" ||
    log.type === "fcoa" ||
    log.type === "fsa" ||
    log.type === "ssa"
  ) {
    return stringifyIfTruthy(log.auth0_client);
  }

  return undefined;
}

function getScopeValue(log: Log): string | undefined {
  if (log.type === "fsa") {
    return log.scope.join(",");
  }

  if (log.type === "seccft") {
    return flattenScopesIfArray(log.scope);
  }

  return undefined;
}

export function createLog(db: DrizzleSQLiteDatabase) {
  return async (tenant_id: string, params: Log): Promise<SqlLog> => {
    const { details } = params;

    const log = {
      id: nanoid(),
      tenant_id,
      ...params,
      auth0_client: stringifyIfTruthy(getAuth0ClientValue(params)),
      details: stringifyIfTruthy(details),
      scope: getScopeValue(params),
      type: params.type,
      user_id: "user_id" in params ? params.user_id : "",
    };

    await db.insert(logs).values(log).execute();

    return {
      ...log,
      // TODO: this is just to keep compatibility with the SqlLog type for now.
      isMobile: params.isMobile ? 1 : 0,
    };
  };
}
