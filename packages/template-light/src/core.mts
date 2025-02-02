export { add, div, mod, mul, sub, valueOf } from "./frac.mts";
import type { Frac } from "./frac.mts";
import { valueOf } from "./frac.mts";

/**
 * Execute a compiled template with operands.
 */
export function execCompiled<OPERAND extends string | number | bigint>(
  operands: OPERAND[],
  compiled: (args: Frac[]) => Frac,
): number {
  const result = compiled(operands.map(valueOf));
  return Number(result.n) / Number(result.d);
}
