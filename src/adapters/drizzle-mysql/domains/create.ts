// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { CreateDomainParams } from "../../interfaces/Domains";
import { SqlDomain } from "../../../types";
import { domains } from "../../../../drizzle-mysql/schema";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function create(db: DrizzleMySqlDatabase) {
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
