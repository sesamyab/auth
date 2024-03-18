import { CreateDomainParams } from "../../interfaces/Domains";
import { SqlDomain } from "../../../types";
import { domains } from "../../../../drizzle-mysql/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function create(db: DrizzleSQLiteDatabase) {
  return async (
    tenant_id: string,
    params: CreateDomainParams,
  ): Promise<SqlDomain> => {
    const domain: SqlDomain = {
      tenant_id,
      ...params,
    };

    await db.insert(domains).values(domain).execute();

    return domain;
  };
}
