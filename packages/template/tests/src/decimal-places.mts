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

describe("integer fast-path regressions", () => {
  for (const [template, expected] of [
    [["trunc(-1260, -2)"] as unknown as TemplateStringsArray, -1200],
    [["round(-1260, -2)"] as unknown as TemplateStringsArray, -1300],
    [["floor(-1234, -2)"] as unknown as TemplateStringsArray, -1300],
    [["ceil(-1234, -2)"] as unknown as TemplateStringsArray, -1200],
  ] as const) {
    const expr = template[0];
    it(`\`${expr}\``, () => {
      expectStrictEqual(f(template), expected);
    });
  }
});

describe("computed decimal places", () => {
  for (const [template, expected] of [
    [["trunc(1234, -(1 / 1) * 2)"] as unknown as TemplateStringsArray, 1200],
    [["round(1234, -(1 / 1) * 2)"] as unknown as TemplateStringsArray, 1200],
    [["floor(1234, -(1 / 1) * 2)"] as unknown as TemplateStringsArray, 1200],
    [["ceil(1234, -(1 / 1) * 2)"] as unknown as TemplateStringsArray, 1300],
  ] as const) {
    const expr = template[0];
    it(`\`${expr}\``, () => {
      expectStrictEqual(f(template), expected);
    });
  }

  it("returns NaN for non-integer decimal places with integer inputs", () => {
    expectNaN(f(["round(1, 0.5)"] as unknown as TemplateStringsArray));
    expectNaN(f(["trunc(1, 0.5)"] as unknown as TemplateStringsArray));
    expectNaN(f(["floor(1, 0.5)"] as unknown as TemplateStringsArray));
    expectNaN(f(["ceil(1, 0.5)"] as unknown as TemplateStringsArray));
  });
});

function expectStrictEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)} but got ${String(actual)}`);
  }
}

function expectNaN(actual: unknown) {
  if (!Number.isNaN(actual)) {
    throw new Error(`Expected NaN but got ${String(actual)}`);
  }
}
