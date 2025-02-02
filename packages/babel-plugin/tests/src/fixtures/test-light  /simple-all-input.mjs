import * as t from "@bignum/template-light";

export default function test() {
  return [
    t.f`${1} + ${2} + ${3}`,
    t.f`${1} - ${2} * ${3}`,
    t.f`${1} + ${6} / ${3}`,
    t.f`${4} - ${7} % ${3}`,
  ];
}
