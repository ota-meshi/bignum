import chai from "chai";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import { setupEngine } from "../../src/index.mjs";

chai.use(jestSnapshotPlugin());
describe("standard tests", () => {
  const f = setupEngine();
  for (const t of [
    test`1 + 2`,
    test`${0.1} + 0.1 * 2`,
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
  ]) {
    it(t.name, () => {
      chai.expect(f(...t.param)).toMatchSnapshot();
    });
  }
});
describe("Big Number tests", () => {
  const f = setupEngine();
  for (const t of [
    test`0.1 + 0.1 + 0.1`,
    test`${0.1} + ${0.1} + ${0.1}`,
    test`0.2 + 0.1`,
    test`${0.2} + ${0.1}`,
    test`0.3 - 0.1`,
    test`${0.3} - ${0.1}`,
  ]) {
    it(t.name, () => {
      chai.expect(f(...t.param)).toMatchSnapshot();
    });
  }
});
describe("Compare tests", () => {
  const f = setupEngine();
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
      chai.expect(f(...t.param)).toMatchSnapshot();
    });
  }
});

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
