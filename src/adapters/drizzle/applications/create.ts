import { Application } from "../../../types";
import { CreateApplicationParams } from "../../interfaces/Applications";
import { DrizzleDatabase } from "../../../services/drizzle";
import { applications } from "../../../../drizzle/schema";

export function create(db: DrizzleDatabase) {
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
