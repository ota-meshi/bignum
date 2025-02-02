import { add as _add, execCompiled as _execCompiled } from "@bignum/template-light/core";
export default function test() {
  return [_execCompiled([0.2, 0.1], _args => _add(_args[0], _args[1])) // 0.3
  ];
}