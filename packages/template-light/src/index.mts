import { compile } from "./compiler.mts";
import { execCompiled } from "./core.mts";

const compileCache = new WeakMap<
  TemplateStringsArray,
  ReturnType<typeof compile>
>();

/** Formula Literal Engine */
export function f<OPERAND extends string | number | bigint>(
  template: TemplateStringsArray,
  ...substitutions: OPERAND[]
): number {
  let fn = compileCache.get(template);
  if (!fn) {
    fn = compile(template);
    compileCache.set(template, fn);
  }
  return execCompiled(substitutions, fn);
}
