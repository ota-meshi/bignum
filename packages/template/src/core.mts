import { BigNum } from "@bignum/core";
export { BigNum };

/**
 * Normalize result value
 */
export function toResult(value: BigNum | bigint): string | number {
  const str = String(value);
  const num = Number(str);
  return String(num) === str ? num : str;
}
