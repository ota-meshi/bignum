import { BigNum } from "../../core/src/index.mjs";

/**
 * Object to String
 */
export function stringify(v: any): string {
  return stringifyValue(v, (v) =>
    JSON.stringify(v, (_k, v) => stringifyValue(v, (v) => v), 2),
  );
}

/**
 * Value to string
 */
function stringifyValue(v: any, def: (v: any) => any) {
  if (v instanceof BigNum) {
    if (v.isNaN() || !v.isFinite()) return `$${v}$`;
  } else if (typeof v === "number") {
    if (Number.isNaN(v) || !Number.isFinite(v)) return `$${v}$`;
  }
  return def(v);
}
