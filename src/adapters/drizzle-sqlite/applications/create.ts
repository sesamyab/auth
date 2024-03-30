import { Application } from "../../../types";
import { CreateApplicationParams } from "../../interfaces/Applications";
import { applications } from "../../../../drizzle-sqlite/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function create(db: DrizzleSQLiteDatabase) {
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
