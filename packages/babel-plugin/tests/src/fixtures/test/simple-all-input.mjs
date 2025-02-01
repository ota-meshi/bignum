import * as t from "@bignum/template";

export default function test() {
  return [
    t.f`1 - 2 * 3`,
    t.f`1 - 6 / 3`,
    t.f`4 - 7 % 3`,
    t.f`2 ** 4 + -${3}`,
    t.f`-1 - 2 * 3`,
    t.f`-1 - 6 / 3`,
    t.f`-4 - 7 % 3`,
    t.f`-2 ** 4 + +${3}`,
    t.f`(1 + ${2}) == ${3}`,
    t.f`(1 + ${2}) != ${3}`,
    t.f`${3} >= ${3}`,
    t.f`${3} > ${3}`,
    t.f`${3} <= ${3}`,
    t.f`${3} < ${3}`,
    t.f`sqrt(${2})`,
    t.f`abs(${-2})`,
    t.f`trunc(1.5)`,
    t.f`round(1.5)`,
    t.f`floor(1.5)`,
    t.f`ceil(1.5)`,
  ];
}
