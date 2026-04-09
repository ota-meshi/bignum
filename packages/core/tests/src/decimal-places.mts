import { BigNum } from "../../src/index.mjs";
import assert from "node:assert";

type DecimalPlaceCase = {
  value: string;
  dp: bigint;
  trunc: string;
  round: string;
  floor: string;
  ceil: string;
};

const DECIMAL_PLACE_CASES: DecimalPlaceCase[] = [
  {
    value: "123.456",
    dp: 2n,
    trunc: "123.45",
    round: "123.46",
    floor: "123.45",
    ceil: "123.46",
  },
  {
    value: "-123.456",
    dp: 2n,
    trunc: "-123.45",
    round: "-123.46",
    floor: "-123.46",
    ceil: "-123.45",
  },
  {
    value: "123.456",
    dp: -2n,
    trunc: "100",
    round: "100",
    floor: "100",
    ceil: "200",
  },
  {
    value: "-123.456",
    dp: -2n,
    trunc: "-100",
    round: "-100",
    floor: "-200",
    ceil: "-100",
  },
  {
    value: "1.25",
    dp: 1n,
    trunc: "1.2",
    round: "1.3",
    floor: "1.2",
    ceil: "1.3",
  },
  {
    value: "-1.25",
    dp: 1n,
    trunc: "-1.2",
    round: "-1.2",
    floor: "-1.3",
    ceil: "-1.2",
  },
];

describe("decimal place rounding tests", () => {
  for (const testCase of DECIMAL_PLACE_CASES) {
    const actual = BigNum.valueOf(testCase.value);
    const label = `${testCase.value} @ ${testCase.dp}`;

    it(`trunc(${label})`, () => {
      assert.strictEqual(`${actual.trunc(testCase.dp)}`, testCase.trunc);
    });
    it(`round(${label})`, () => {
      assert.strictEqual(`${actual.round(testCase.dp)}`, testCase.round);
    });
    it(`floor(${label})`, () => {
      assert.strictEqual(`${actual.floor(testCase.dp)}`, testCase.floor);
    });
    it(`ceil(${label})`, () => {
      assert.strictEqual(`${actual.ceil(testCase.dp)}`, testCase.ceil);
    });
  }

  it("rounds repeating decimals after quantizing", () => {
    const value = BigNum.valueOf(1).divide(3);
    assert.strictEqual(`${value.trunc(2)}`, "0.33");
    assert.strictEqual(`${value.round(2)}`, "0.33");
    assert.strictEqual(`${value.floor(2)}`, "0.33");
    assert.strictEqual(`${value.ceil(2)}`, "0.34");
  });

  it("renders repeating decimals with up to 20 fractional digits", () => {
    assert.strictEqual(
      `${BigNum.valueOf(1).divide(3)}`,
      "0.33333333333333333333",
    );
    assert.strictEqual(
      `${BigNum.valueOf(3).divide(2.25)}`,
      "1.33333333333333333333",
    );
    assert.strictEqual(
      `${BigNum.valueOf("12345678901234567891").divide(3)}`,
      "4115226300411522630.33333333333333333333",
    );
    assert.strictEqual(
      `${BigNum.valueOf(1).divide("30000000000000000000000000")}`,
      "0.000000000000000000000000033333333333333333333",
    );
    assert.strictEqual(
      `${BigNum.valueOf(1).add(
        BigNum.valueOf(1).divide("30000000000000000000000000"),
      )}`,
      "1",
    );
  });

  it("keeps finite decimals exact", () => {
    assert.strictEqual(`${BigNum.valueOf("1.25")}`, "1.25");
    assert.strictEqual(`${BigNum.valueOf(1).divide(8)}`, "0.125");
  });

  it("preserves Infinity when dp is provided", () => {
    assert.strictEqual(`${BigNum.valueOf(Infinity).round(2)}`, "Infinity");
    assert.strictEqual(`${BigNum.valueOf(-Infinity).floor(-2)}`, "-Infinity");
  });

  it("returns NaN for non-integer decimal places", () => {
    assert.ok(BigNum.valueOf(1).round(0.5).isNaN());
    assert.ok(BigNum.valueOf(1).trunc("1.5").isNaN());
  });
});
