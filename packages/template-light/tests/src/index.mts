import chai from "chai";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import { f } from "../../src/index.mjs";

chai.use(jestSnapshotPlugin());
describe("standard tests", () => {
  for (const t of [
    // Doc tests
    // add
    test`${0.1} + ${0.2}`, // 0.3
    // subtract
    test`${0.3} - ${0.1}`, // 0.2
    // multiply
    test`${0.07} * ${100}`, // 7
    // divide
    test`${0.6} / ${0.2}`, // 3
    // modulo
    test`${0.6} % ${0.2}`, // 0
    /* Parentheses */
    test`(${0.1} + ${0.2}) * ${10}`, // 3
    test`${0.1} + ${0.2} * ${10}`, // 2.1
    /* Unary Operators */
    test`${0.3} + ${-0.1}`, // 0.2

    test`${0.000002} * ${10}`, // 0.000002
    test`${0.1} * ${10}`, // 1
    test`${1} + ${2}`,
    test`${0.1} + ${0.1} * ${2}`,
    test`${1}+${2}`,
    test`${1.1} + ${2.1}`,
    test`${1}+${-2}`,
    test`${1}-${+2}`,
    test`${1.1}+${-2.2}`,
    test`${1.2}+${0.8}`,
    test`${1} + ${3}`,
    test`${1} + ${2} * ${3}`,
    test`${1.2} + ${2.3} * ${3.4}`,
    test`(${1} + ${2}) * ${3}`,
    test`${1} * (${-1}*(${23} % ${4}))`,
    test`${1.5} * (${-1}*(${23} % ${4}))`,
    test`${3} - ${3} / ${3}`,
    test`${3.2} - ${3.2} / ${3.2}`,
    test`(${1} + ${2}) * ${3}`,
    test`(${1}+${2})*${3}`,
    test`${2.3} / ${1.1}`,
    test`${2.3} % ${1.1}`,
    test`${"22000000"} / ${1.1}`,
    test`${"1e42"}/${"1e31"}`,
    test`${"1e-42"}*${"1e38"}`,
    test`${"1e+42"}/${"1e31"}`,
    test`${"1.23e42"}/${"1e31"}`,
    test`${"1.23e-42"}*${"1e38"}`,
    test`${"1.23e+42"}/${"1e31"}`,
    test`${"-1.23e42"}/${"1e31"}`,
    test`${"-1.23e-42"}*${"1e38"}`,
    test`${"-1.23e+42"}/${"1e31"}`,
  ]) {
    it(t.name, () => {
      chai.expect(f(...t.param)).toMatchSnapshot();
    });
  }
});
describe("Round tests", () => {
  for (const t of [
    test`${0.1} + ${0.1} + ${0.1}`,
    test`${0.2} + ${0.1}`,
    test`${0.3} - ${0.1}`,
  ]) {
    it(t.name, () => {
      chai.expect(f(...t.param)).toMatchSnapshot();
    });
  }
});

/**
 *
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
    param: [template, ...substitutions] as const,
  };
}
