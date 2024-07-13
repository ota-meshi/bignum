import { compile } from "../../src/index.mjs";
import type { BTContext } from "@bignum/shared";
import * as snap from "@ota-meshi/test-snapshot";

const context: BTContext<number | bigint | string, string> = {
  binaryOperations: {
    "+": (a, b) => `(${a} + ${b})`,
    "-": (a, b) => `(${a} - ${b})`,
    "*": (a, b) => `(${a} * ${b})`,
    "/": (a, b) => `(${a} / ${b})`,
    "%": (a, b) => `(${a} % ${b})`,
    "**": (a, b) => `(${a} ** ${b})`,
    "<": (a, b) => `(${a} < ${b})`,
    "<=": (a, b) => `(${a} <= ${b})`,
    ">": (a, b) => `(${a} > ${b})`,
    ">=": (a, b) => `(${a} >= ${b})`,
    "==": (a, b) => `(${a} == ${b})`,
    "!=": (a, b) => `(${a} != ${b})`,
  },
  unaryOperations: {
    "-": (a) => `(-${a})`,
    "+": (a) => `(+${a})`,
  },
  variables: {
    PI: "PI",
  },
  functions: {
    abs: (a) => `abs(${a})`,
    trunc: (a) => `trunc(${a})`,
    round: (a) => `round(${a})`,
    ceil: (a) => `ceil(${a})`,
    floor: (a) => `floor(${a})`,
    foo: (...args) => `foo(${args.join(", ")})`,
  },
};

describe("standard tests", () => {
  for (const t of [
    test`1 + 2`,
    test`1+2`,
    test`1.1 + 2.1`,
    test`1+-2`,
    test`1-+2`,
    test`1.1+-2.2`,
    test`1.2+0.8`,
    test`1 + ${3}`,
    test`1 + ${2} * 3`,
    test`1.2 + ${2.3} * 3.4`,
    test`(1 + ${2}) * 3`,
    test`1 * -(23 % 4)`,
    test`1.5 * -(23 % 4)`,
    test`3*3*PI`,
    test`3.2*3.2*PI`,
    test`trunc(300*1.08)`,
    test`trunc(320*1.08)`,
    test`1 + 2 * 3`,
    test`3 - 3 / 3`,
    test`3.2 - 3.2 / 3.2`,
    test`(1 + 2) * 3`,
    test`2 * 2 ** 3`,
    test`2.1 * 2.3 ** 3`,
    test`2.1 * 2.3 ** (1.5+1.5)`,
    // test`2.1 * 2.3 ** 3.4`, // Error
    test`4 / 2 ** 2`,
    test`4.1 / 2.2 ** 2`,
    test`(2 * 2) ** 3`,
    test`abs(-10)`,
    test`(2 * 2) / 10 ** 20`,
    test`(2 * 2) / 10 ** 21`, // Overflow the default maximum number of decimal places. (20).
    test`2.3 / 1.1`,
    test`2.3 % 1.1`,
    test`22000000 / 1.1`,
    ...[
      "1.49",
      "1.5",
      "1.51",
      "1.501",
      "-1.49",
      "-1.5",
      "-1.51",
      "-1.501",
    ].flatMap((v) => [
      test`trunc(${v})`,
      test`round(${v})`,
      test`floor(${v})`,
      test`ceil(${v})`,
      test`abs(${v})`,
    ]),
    test`1e42+1`,
    test`1e-42+1`,
    test`1e+42+1`,
    test`1.23e42+1`,
    test`1.23e-42+1`,
    test`1.23e+42+1`,
    test`-1.23e42+1`,
    test`-1.23e-42+1`,
    test`-1.23e+42+1`,
    test`foo() + foo(1) + foo(1, 2) + foo(1, 2, 3)`,
    test`2 ** 3 ** 4`,
    test`(2 ** 3) ** 4`,
  ]) {
    it(t.name, () => {
      snap
        .expect(compile(t.template)(t.substitutions, context))
        .toMatchSnapshot();
    });
  }
});
describe("Big Number tests", () => {
  for (const t of [
    test`0.1 + 0.1 + 0.1`,
    test`${0.1} + ${0.1} + ${0.1}`,
    test`0.2 + 0.1`,
    test`${0.2} + ${0.1}`,
    test`0.3 - 0.1`,
    test`${0.3} - ${0.1}`,
  ]) {
    it(t.name, () => {
      snap
        .expect(compile(t.template)(t.substitutions, context))
        .toMatchSnapshot();
    });
  }
});
describe("Compare tests", () => {
  for (const t of [
    test`0.1 + 0.1 + 0.1 <= 0.3`,
    test`${0.1} + ${0.1} + ${0.1} == ${0.3}`,
    test`0.2 + 0.1 != 0.3`,
    test`${0.2} + ${0.1} != ${0.3}`,
    test`0.3 - 0.1 >= 0.2`,
    test`${0.3} - ${0.1} >= ${0.2}`,
    test`${0.3} - ${0.1} < ${0.2}`,
    test`${0.3} - ${0.1} > ${0.2}`,
    ...[
      [0.1, 0.1],
      [0.1, 0.2],
      [0.2, 0.1],
    ].flatMap(([a, b]) => [
      test`${a} < ${b}`,
      test`${a} <= ${b}`,
      test`${a} > ${b}`,
      test`${a} >= ${b}`,
      test`${a} == ${b}`,
      test`${a} != ${b}`,
    ]),
  ]) {
    it(t.name, () => {
      snap
        .expect(compile(t.template)(t.substitutions, context))
        .toMatchSnapshot();
    });
  }
});

/**
 * Make test data
 */
function test(
  template: TemplateStringsArray,
  ...substitutions: (number | bigint | string)[]
) {
  let name = "`";
  for (let index = 0; index < template.length; index++) {
    name += template[index];
    if (index < substitutions.length) {
      name += `\${${substitutions[index]}}`;
    }
  }
  name += "`";
  return {
    name,
    template,
    substitutions,
  };
}
