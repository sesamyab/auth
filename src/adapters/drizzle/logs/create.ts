import { nanoid } from "nanoid";
import { SqlLog, Log } from "../../../types";
import { DrizzleDatabase } from "../../../services/drizzle";
import { logs } from "../../../../drizzle/schema";

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

export function createLog(db: DrizzleDatabase) {
  return async (tenant_id: string, params: Log): Promise<SqlLog> => {
    const { details } = params;

    const log: SqlLog = {
      id: nanoid(),
      tenant_id,
      ...params,
      auth0_client: stringifyIfTruthy(getAuth0ClientValue(params)),
      details: stringifyIfTruthy(details),
      scope: getScopeValue(params),
      isMobile: params.isMobile ? 1 : 0,
      type: params.type,
    };

    await db
      .insert(logs)
      // TODO: sort out the type here
      .values(log as any)
      .execute();
    return log;
  };
}
