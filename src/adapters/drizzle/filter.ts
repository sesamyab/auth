import { sql } from "drizzle-orm";

function luceneFilterToSQL(query: string, searchableColumns: string[]): string {
  const filters = query
    .split(/\s+/)
    .map((q) => q.replace(/=/g, ":"))
    .map((filter) => {
      let isNegation = filter.startsWith("-");
      let key, value, isExistsQuery;

      if (filter.startsWith("-_exists_:")) {
        key = filter.substring(10); // Remove '-_exists_:' part
        isExistsQuery = true;
        isNegation = true;
      } else if (filter.startsWith("_exists_:")) {
        key = filter.substring(9); // Remove '_exists_:' part
        isExistsQuery = true;
        isNegation = false;
      } else if (filter.includes(":")) {
        [key, value] = filter.split(":").map((part) => part.trim());
        if (isNegation) {
          key = key.substring(1); // Remove '-' prefix
        }
        isExistsQuery = false;
      } else {
        key = null;
        value = filter;
        isExistsQuery = false;
      }

      return { key, value, isNegation, isExistsQuery };
    });

  let sqlQuery = "";
  const whereConditions: string[] = [];

  filters.forEach(({ key, value, isNegation, isExistsQuery }, index) => {
    if (key) {
      if (isExistsQuery) {
        const condition = isNegation
          ? `(${key} IS NULL)`
          : `(${key} IS NOT NULL)`;
        whereConditions.push(condition);
      } else {
        const condition = isNegation
          ? `(${key} != '${value}')`
          : `(${key} = '${value}')`;
        whereConditions.push(condition);
      }
    } else {
      // Generic single-word search across specified columns
      const likeConditions = searchableColumns
        .map((col) => `${col} LIKE '%${value}%'`)
        .join(" OR ");
      whereConditions.push(`(${likeConditions})`);
    }
  });

  sqlQuery += whereConditions.join(" AND ");

  return sqlQuery;
}

export function luceneFilter(query: string, searchableColumns: string[]) {
  return sql`${luceneFilterToSQL(query, searchableColumns)}`;
}
