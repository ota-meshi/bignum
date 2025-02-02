import { compile } from "./compiler.mts";
import { execCompiled } from "./core.mts";

/** Formula Literal Engine */
export function f<OPERAND extends string | number | bigint>(
  template: TemplateStringsArray,
  ...substitutions: OPERAND[]
): number {
  const fn = compile(template);
  return execCompiled(substitutions, fn);
}
