// WARNING - this file is generated from the SQLite adapter. Do not edit!
export function transformNullsToUndefined(value: any): any {
  if (value === null) {
    return undefined;
  } else if (typeof value === "object" && !Array.isArray(value)) {
    Object.keys(value).forEach((key) => {
      value[key] = transformNullsToUndefined(value[key]);
    });
    return value;
  } else {
    return value;
  }
}
