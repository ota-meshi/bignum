import { add as _add, multiply as _multiply, toResult as _toResult } from "@bignum/template/core";
export default function test() {
  let i = 3;
  return [_toResult(_multiply(i++, _add(i++, i++)))];
}