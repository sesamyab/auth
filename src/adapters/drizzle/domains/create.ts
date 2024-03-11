import { CreateDomainParams } from "../../interfaces/Domains";
import { SqlDomain } from "../../../types";
import { DrizzleDatabase } from "../../../services/drizzle";
import { domains } from "../../../../drizzle/schema";

export function create(db: DrizzleDatabase) {
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
