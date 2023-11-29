import { Env } from "../../types";
import { DataAdapters } from "../interfaces";
import { createCertificatesAdapter } from "./Certificates";

export default function createAdapters(env: Env): Partial<DataAdapters> {
  return {
    certificates: createCertificatesAdapter(env),
  };
}
