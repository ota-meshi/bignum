import * as t from "@bignum/template-light";

export default function test() {
  let i = 3;
  return [t.f`${i++} * (${i++} + ${i++})`];
}
