import { add as _add, mul as _mul, execCompiled as _execCompiled } from "@bignum/template-light/core";
import * as t from "@bignum/template-light";
export default function test() {
  let i = 3;
  return [_execCompiled([i++, i++, i++], _args => _mul(_args[0], _add(_args[1], _args[2])))];
}