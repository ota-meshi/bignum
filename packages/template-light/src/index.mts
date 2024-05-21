import { compile } from "./compiler.mts";

/** Formula Literal Engine */
export function f<OPERAND extends string | number | bigint>(
  template: TemplateStringsArray,
  ...substitutions: OPERAND[]
): number {
  const fn = compile(template);
  const result = fn(substitutions);
  return Number(result.n) / Number(result.d);
}
