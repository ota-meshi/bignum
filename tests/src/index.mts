import chai from "chai";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import { setupEngine } from "../../src/index.mjs";

chai.use(jestSnapshotPlugin());
describe("standard tests", () => {
  const f = setupEngine();
  for (const t of [
    test`1 + 2`,
    test`1+2`,
    test`1+-2`,
    test`1.2+0.8`,
    test`1 + ${3}`,
    test`1 + ${2} * 3`,
    test`(1 + ${2}) * 3`,
    test`1 * -(23 % 4)`,
    test`3*3*PI`,
    test`trunc(300*1.08)`,
    test`trunc(320*1.08)`,
    test`1 + 2 * 3`,
    test`3 - 3 / 3`,
    test`(1 + 2) * 3`,
    test`2 * 2 ** 3`,
    test`4 / 2 ** 2`,
    test`(2 * 2) ** 3`,
    test`sqrt(9)`,
    test`abs(-10)`,
  ]) {
    it(t.name, () => {
      chai.expect(f(...t.param)).toMatchSnapshot();
    });
  }
});

function test<OPERAND>(
  template: TemplateStringsArray,
  ...substitutions: OPERAND[]
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
