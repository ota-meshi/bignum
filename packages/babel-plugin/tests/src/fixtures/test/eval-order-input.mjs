import * as t from "@bignum/template";

export default function test() {
  let i = 3;
  return [t.f`${i++} * (${i++} + ${i++})`];
}
