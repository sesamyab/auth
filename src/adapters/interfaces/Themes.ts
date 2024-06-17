import { Theme } from "../../types/Theme";

export interface ThemesAdapter {
  get: (tenant_id: string, id: string) => Promise<Theme | null>;
}
