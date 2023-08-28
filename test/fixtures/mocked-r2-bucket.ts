import { readFileSync } from "fs";
import { join } from "path";

export function mockedR2Bucket() {
  return {
    get: async (path: string) => {
      // It doesn't look like we're using this elsewhere in the codebase... as the R2 bucket definitely is not in the root of the project
      const file = readFileSync(
        join(__dirname, "../../src/email-templates/output", path)
      );

      return {
        text: async () => {
          return file.toString();
        },
      };
    },
  } as R2Bucket;
}
