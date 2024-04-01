// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { Application } from "../../../types";
import { CreateApplicationParams } from "../../interfaces/Applications";
import { applications } from "../../../../drizzle-mysql/schema";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function create(db: DrizzleMySqlDatabase) {
  return async (
    tenant_id: string,
    params: CreateApplicationParams,
  ): Promise<Application> => {
    const application: Application = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id,
      ...params,
    };

    db.insert(applications).values(application).execute();

    return application;
  };
}
