import { f } from "../../src/index.mjs";

describe("decimal place functions", () => {
  for (const [template, expected] of [
    [["round(1 / 3, 2)"] as unknown as TemplateStringsArray, 0.33],
    [["trunc(1 / 3, 2)"] as unknown as TemplateStringsArray, 0.33],
    [["ceil(1 / 3, 2)"] as unknown as TemplateStringsArray, 0.34],
    [["floor(-1 / 3, 2)"] as unknown as TemplateStringsArray, -0.34],
    [["round(1234.56, -2)"] as unknown as TemplateStringsArray, 1200],
    [["trunc(1234.56, -2)"] as unknown as TemplateStringsArray, 1200],
    [["ceil(1234.56, -2)"] as unknown as TemplateStringsArray, 1300],
    [["floor(-1234.56, -2)"] as unknown as TemplateStringsArray, -1300],
  ] as const) {
    const expr = template[0];
    it(`\`${expr}\``, () => {
      expectStrictEqual(f(template), expected);
    });
  }
});

function expectStrictEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)} but got ${String(actual)}`);
  }
}
