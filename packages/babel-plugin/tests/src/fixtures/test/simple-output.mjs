import { add as _add, toResult as _toResult } from "@bignum/template/core";
export default function test() {
  return [_toResult(_add(_add(1, 2), 3))];
}