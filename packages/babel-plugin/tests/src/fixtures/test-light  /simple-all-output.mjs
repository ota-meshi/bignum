import { add as _add, execCompiled as _execCompiled, mul as _mul, sub as _sub, div as _div, mod as _mod } from "@bignum/template-light/core";
export default function test() {
  return [_execCompiled([1, 2, 3], _args => _add(_add(_args[0], _args[1]), _args[2])), _execCompiled([1, 2, 3], _args2 => _sub(_args2[0], _mul(_args2[1], _args2[2]))), _execCompiled([1, 6, 3], _args3 => _add(_args3[0], _div(_args3[1], _args3[2]))), _execCompiled([4, 7, 3], _args4 => _sub(_args4[0], _mod(_args4[1], _args4[2])))];
}