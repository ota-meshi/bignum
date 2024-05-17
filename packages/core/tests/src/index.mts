/* eslint @typescript-eslint/no-shadow: 0 -- ignore check */
import chai, { assert } from "chai";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import { BigNum } from "../../src/index.mjs";
chai.use(jestSnapshotPlugin());

type BTest = {
  op: string | ((a: number, b: number) => string);
  n: (a: number, b: number) => number | bigint;
  b: (a: BigNum, b: BigNum) => BigNum;
  ignore?: (a: number, b: number) => boolean;
};
const B_TESTS: BTest[] = [
  {
    op: "+",
    n: (a, b) => a + b,
    b: (a: BigNum, b: BigNum) => a.add(b),
  },
  {
    op: "-",
    n: (a, b) => a - b,
    b: (a: BigNum, b: BigNum) => a.subtract(b),
  },
  {
    op: "*",
    n: (a, b) => a * b,
    b: (a: BigNum, b: BigNum) => a.multiply(b),
  },
  {
    op: "/",
    n: (a, b) => a / b,
    b: (a: BigNum, b: BigNum) => a.divide(b),
  },
  {
    op: "%",
    n: (a, b) =>
      isFinite(a) && isFinite(b) && Number.isInteger(a / b) ? 0 : a % b,
    b: (a: BigNum, b: BigNum) => a.modulo(b),
  },
  {
    op: "**",
    n: (a, b) => a ** b,
    b: (a: BigNum, b: BigNum) => a.pow(b),
    ignore: (a, b) => isFinite(a) && isFinite(b) && Math.abs(b) > 1000,
  },
  {
    op: "* 10 **",
    n: (a, b) => a * 10 ** b,
    b: (a: BigNum, b: BigNum) => a.scaleByPowerOfTen(b),
    ignore: (a, b) => isFinite(a) && isFinite(b) && Math.abs(b) > 1000,
  },
  {
    op: (a, b) => `${a} ** (1/${b})`,
    n: (a, b) => a ** (1 / b),
    b: (a: BigNum, b: BigNum) => a.nthRoot(b),
    ignore: (a, b) =>
      isFinite(a) && isFinite(b) && (a < 0 || String(b).length > 5),
  },
  {
    // use pow for nthRoot
    op: (a, b) => `${a} ** /*pow*/ (1/${b})`,
    n: (a, b) => a ** (1 / b),
    b: (a: BigNum, b: BigNum) => a.pow(BigNum.valueOf(1).divide(b)),
    ignore: (a, b) =>
      isFinite(a) && isFinite(b) && (a < 0 || String(b).length > 5),
  },
  {
    op: "compareTo",
    n: (a, b) => (a === b ? 0 : a > b ? 1 : a < b ? -1 : NaN),
    b: (a: BigNum, b: BigNum) => BigNum.valueOf(a.compareTo(b)),
  },
];

type UTest = {
  fn: string;
  n: (a: number) => number;
  b: (a: BigNum) => BigNum;
  ignore?: (a: number) => boolean;
};
const U_TESTS: UTest[] = [
  {
    fn: "negate",
    n: (a) => -a,
    b: (a: BigNum) => a.negate(),
  },
  {
    fn: "abs",
    n: (a) => Math.abs(a),
    b: (a: BigNum) => a.abs(),
  },
  {
    fn: "trunc",
    n: (a) => Math.trunc(a),
    b: (a: BigNum) => a.trunc(),
  },
  {
    fn: "round",
    n: (a) => Math.round(a),
    b: (a: BigNum) => a.round(),
  },
  {
    fn: "ceil",
    n: (a) => Math.ceil(a),
    b: (a: BigNum) => a.ceil(),
  },
  {
    fn: "floor",
    n: (a) => Math.floor(a),
    b: (a: BigNum) => a.floor(),
  },
  {
    fn: "sqrt",
    n: (a) => Math.sqrt(a),
    b: (a: BigNum) => a.sqrt(),
    ignore: (a) => isFinite(a) && a < 0,
  },
];

describe("Calc tests", () => {
  for (const t of B_TESTS) {
    for (const [a, b] of [
      [8, 3],
      [18, 1.4],
      [0.2, 2],
      [123.45, 20],
      [16777216, 3],
      [4294967296, 4],
      [27, 3],
      [5, 4],
      [101.669, 0],
      [146.007, -2],
      [146.007, -88],
      [1n, 2n],
      [0.443, 112.586],
      [131.868, 3],
      [-37.72, 112.3],
      [-82.659, -81.86],
      [48.723, 20.56],
      [-71.55, -0.225],
      [-2.944, -0.128],
    ] satisfies ([number, number] | [bigint, bigint])[]) {
      [[a, b], ...(a === b ? [] : [[b, a]])].forEach(([a, b]) => {
        if (t.ignore?.(Number(a), Number(b))) return;
        const name =
          typeof t.op === "function"
            ? t.op(Number(a), Number(b))
            : `${a} ${t.op} ${b}`;
        it(name, () => {
          const ba = new BigNum(a);
          const bb = new BigNum(b);
          const actual = t.b(ba, bb);
          const expect = t.n(Number(a), Number(b));
          lazyAssert(actual, expect);
        });
      });
    }
  }
  for (const t of U_TESTS) {
    for (const a of [
      2.25,
      70.161,
      0.0145,
      271441n,
      1n,
      10n,
      100n,
      -37.72,
      112.3,
      -82.659,
      -81.86,
      48.723,
      20.56,
    ]) {
      if (t.ignore?.(Number(a))) return;
      it(`${t.fn}(${a})`, () => {
        const ba = new BigNum(a);
        const actual = t.b(ba);
        const expect = t.n(Number(a));
        lazyAssert(actual, expect);
      });
    }
  }
});

describe("standard tests", () => {
  for (const t of [
    () => BigNum.valueOf(0.2).add(0.1),
    () => BigNum.valueOf(2).multiply(0.1).add(0.1),
    () => BigNum.valueOf("2e2").divide(1000).add(0.1),
    // add
    () => BigNum.valueOf(0.02).add(0.1),
    () => BigNum.valueOf(0.2).add(0.01),
    () => BigNum.valueOf(NaN).add(3),
    () => BigNum.valueOf(3).add(NaN),
    () => BigNum.valueOf(NaN).add(NaN),
    () => BigNum.valueOf(Infinity).add(3),
    () => BigNum.valueOf(-Infinity).add(3),
    () => BigNum.valueOf(3).add(Infinity),
    () => BigNum.valueOf(3).add(-Infinity),
    () => BigNum.valueOf(Infinity).add(-3),
    () => BigNum.valueOf(-Infinity).add(-3),
    () => BigNum.valueOf(-3).add(Infinity),
    () => BigNum.valueOf(-3).add(-Infinity),
    () => BigNum.valueOf(Infinity).add(Infinity),
    () => BigNum.valueOf(-Infinity).add(Infinity),
    () => BigNum.valueOf(Infinity).add(-Infinity),
    () => BigNum.valueOf(-Infinity).add(-Infinity),
    // subtract
    () => BigNum.valueOf(0.3).subtract(0.1),
    () => BigNum.valueOf(0.02).subtract(0.1),
    () => BigNum.valueOf(0.2).subtract(0.01),
    () => BigNum.valueOf(NaN).subtract(3),
    () => BigNum.valueOf(3).subtract(NaN),
    () => BigNum.valueOf(NaN).subtract(NaN),
    () => BigNum.valueOf(Infinity).subtract(3),
    () => BigNum.valueOf(-Infinity).subtract(3),
    () => BigNum.valueOf(3).subtract(Infinity),
    () => BigNum.valueOf(3).subtract(-Infinity),
    () => BigNum.valueOf(Infinity).subtract(-3),
    () => BigNum.valueOf(-Infinity).subtract(-3),
    () => BigNum.valueOf(-3).subtract(Infinity),
    () => BigNum.valueOf(-3).subtract(-Infinity),
    () => BigNum.valueOf(Infinity).subtract(Infinity),
    () => BigNum.valueOf(-Infinity).subtract(Infinity),
    () => BigNum.valueOf(Infinity).subtract(-Infinity),
    () => BigNum.valueOf(-Infinity).subtract(-Infinity),
    // signum
    () => BigNum.valueOf(0).signum(),
    () => BigNum.valueOf(1).signum(),
    () => BigNum.valueOf(-1).signum(),
    () => BigNum.valueOf(NaN).signum(),
    () => BigNum.valueOf(Infinity).signum(),
    () => BigNum.valueOf(-Infinity).signum(),
    // negate
    () => BigNum.valueOf(0).negate(),
    () => BigNum.valueOf(1).negate(),
    () => BigNum.valueOf(-1).negate(),
    () => BigNum.valueOf(NaN).negate(),
    () => BigNum.valueOf(Infinity).negate(),
    () => BigNum.valueOf(-Infinity).negate(),
    // abs
    () => BigNum.valueOf(0).abs(),
    () => BigNum.valueOf(1).abs(),
    () => BigNum.valueOf(-1).abs(),
    () => BigNum.valueOf(NaN).abs(),
    () => BigNum.valueOf(Infinity).abs(),
    () => BigNum.valueOf(-Infinity).abs(),
    // multiply
    () => BigNum.valueOf(0.001).multiply(0.001),
    () => BigNum.valueOf(0.001).multiply(0.002),
    () => BigNum.valueOf(0.002).multiply(0.001),
    () => BigNum.valueOf(NaN).multiply(3),
    () => BigNum.valueOf(3).multiply(NaN),
    () => BigNum.valueOf(NaN).multiply(NaN),
    () => BigNum.valueOf(Infinity).multiply(3),
    () => BigNum.valueOf(-Infinity).multiply(3),
    () => BigNum.valueOf(3).multiply(Infinity),
    () => BigNum.valueOf(3).multiply(-Infinity),
    () => BigNum.valueOf(Infinity).multiply(-3),
    () => BigNum.valueOf(-Infinity).multiply(-3),
    () => BigNum.valueOf(-3).multiply(Infinity),
    () => BigNum.valueOf(-3).multiply(-Infinity),
    () => BigNum.valueOf(Infinity).multiply(Infinity),
    () => BigNum.valueOf(-Infinity).multiply(Infinity),
    () => BigNum.valueOf(Infinity).multiply(-Infinity),
    () => BigNum.valueOf(-Infinity).multiply(-Infinity),
    () => BigNum.valueOf(0).multiply(Infinity),
    () => BigNum.valueOf(0).multiply(-Infinity),
    () => BigNum.valueOf(Infinity).multiply(0),
    () => BigNum.valueOf(-Infinity).multiply(0),
    // divide
    () => BigNum.valueOf(1).divide(3),
    () => BigNum.valueOf(-1).divide(3),
    () => BigNum.valueOf(-1).divide(-3),
    () => BigNum.valueOf(200).divide(100).add(0.1),
    () => BigNum.valueOf(-0.001).divide(0.003),
    () => BigNum.valueOf(-0.001).divide(-0.003),
    () => BigNum.valueOf(1).divide(BigNum.valueOf(1).divide(3)),
    () => BigNum.valueOf(3).divide(BigNum.valueOf(1).divide(3).multiply(3)),
    () => BigNum.valueOf(1).divide(3).multiply(3),
    () =>
      // 1/3 * (1/3) * 9
      BigNum.valueOf(1)
        .divide(3)
        .multiply(BigNum.valueOf(1).divide(3))
        .multiply(9),
    () =>
      // ((1/3)/2) * ((1/3)/2) * 9 * 4
      BigNum.valueOf(1)
        .divide(3)
        .divide(2)
        .multiply(BigNum.valueOf(1).divide(3).divide(2))
        .multiply(9)
        .multiply(4),
    () =>
      // 1 / ((1/3)/2) * 9 * 4
      BigNum.valueOf(1)
        .divide(BigNum.valueOf(1).divide(3).divide(2))
        .multiply(9)
        .multiply(4),
    () =>
      // 1/3 / ((1/3)/2) * 9 * 4
      BigNum.valueOf(1)
        .divide(3)
        .divide(BigNum.valueOf(1).divide(3).divide(2))
        .multiply(9)
        .multiply(4),
    () =>
      // (1/3 + 1/3 + 1) * 3
      BigNum.valueOf(1)
        .divide(3)
        .add(BigNum.valueOf(1).divide(3))
        .add(1)
        .multiply(3),
    () =>
      // (1/3 + 1/3 - 1) * 3
      BigNum.valueOf(1)
        .divide(3)
        .add(BigNum.valueOf(1).divide(3))
        .subtract(1)
        .multiply(3),
    () => BigNum.valueOf(NaN).divide(3),
    () => BigNum.valueOf(3).divide(NaN),
    () => BigNum.valueOf(NaN).divide(NaN),
    () => BigNum.valueOf(Infinity).divide(3),
    () => BigNum.valueOf(-Infinity).divide(3),
    () => BigNum.valueOf(3).divide(Infinity),
    () => BigNum.valueOf(3).divide(-Infinity),
    () => BigNum.valueOf(Infinity).divide(-3),
    () => BigNum.valueOf(-Infinity).divide(-3),
    () => BigNum.valueOf(-3).divide(Infinity),
    () => BigNum.valueOf(-3).divide(-Infinity),
    () => BigNum.valueOf(Infinity).divide(Infinity),
    () => BigNum.valueOf(-Infinity).divide(Infinity),
    () => BigNum.valueOf(Infinity).divide(-Infinity),
    () => BigNum.valueOf(-Infinity).divide(-Infinity),
    () => BigNum.valueOf(Infinity).divide(0),
    () => BigNum.valueOf(-Infinity).divide(0),
    () => BigNum.valueOf(0).divide(Infinity),
    () => BigNum.valueOf(0).divide(-Infinity),
    // modulo
    () => BigNum.valueOf(1).modulo(3),
    () => BigNum.valueOf(3).modulo(3),
    () => BigNum.valueOf(10).modulo(3),
    () => BigNum.valueOf(-1).modulo(3),
    () => BigNum.valueOf(-3).modulo(3),
    () => BigNum.valueOf(-10).modulo(3),
    () => BigNum.valueOf(NaN).modulo(3),
    () => BigNum.valueOf(3).modulo(NaN),
    () => BigNum.valueOf(NaN).modulo(NaN),
    () => BigNum.valueOf(Infinity).modulo(3),
    () => BigNum.valueOf(-Infinity).modulo(3),
    () => BigNum.valueOf(3).modulo(Infinity),
    () => BigNum.valueOf(3).modulo(-Infinity),
    () => BigNum.valueOf(Infinity).modulo(-3),
    () => BigNum.valueOf(-Infinity).modulo(-3),
    () => BigNum.valueOf(-3).modulo(Infinity),
    () => BigNum.valueOf(-3).modulo(-Infinity),
    () => BigNum.valueOf(Infinity).modulo(Infinity),
    () => BigNum.valueOf(-Infinity).modulo(Infinity),
    () => BigNum.valueOf(Infinity).modulo(-Infinity),
    () => BigNum.valueOf(-Infinity).modulo(-Infinity),
    () => BigNum.valueOf(-2.944).modulo(-0.128),
    // pow
    () => BigNum.valueOf(2).pow(2),
    () => BigNum.valueOf(2).pow(3),
    () => BigNum.valueOf(2).pow(4),
    () => BigNum.valueOf(2).pow(-2),
    () => BigNum.valueOf(2).pow(-3),
    () => BigNum.valueOf(2).pow(-4),
    () => BigNum.valueOf(0.2).pow(2),
    () => BigNum.valueOf(0.2).pow(3),
    () => BigNum.valueOf(0.2).pow(4),
    () => BigNum.valueOf(0.2).pow(-2),
    () => BigNum.valueOf(0.2).pow(-3),
    () => BigNum.valueOf(0.2).pow(-4),
    () => BigNum.valueOf(0.2).pow(BigNum.valueOf(0.2).add(3.8)),
    () => BigNum.valueOf(4).pow(2.5),
    () => BigNum.valueOf(2).pow(2.2),
    () => BigNum.valueOf(NaN).pow(3),
    () => BigNum.valueOf(3).pow(NaN),
    () => BigNum.valueOf(NaN).pow(-3),
    () => BigNum.valueOf(NaN).pow(NaN),
    () => BigNum.valueOf(Infinity).pow(2),
    () => BigNum.valueOf(-Infinity).pow(2),
    () => BigNum.valueOf(Infinity).pow(-2),
    () => BigNum.valueOf(-Infinity).pow(-2),
    () => BigNum.valueOf(2).pow(Infinity),
    () => BigNum.valueOf(2).pow(-Infinity),
    () => BigNum.valueOf(Infinity).pow(Infinity),
    () => BigNum.valueOf(-Infinity).pow(Infinity),
    () => BigNum.valueOf(Infinity).pow(-Infinity),
    () => BigNum.valueOf(-Infinity).pow(-Infinity),
    // scaleByPowerOfTen
    () => BigNum.valueOf(2).scaleByPowerOfTen(2),
    () => BigNum.valueOf(2).scaleByPowerOfTen(3),
    () => BigNum.valueOf(2).scaleByPowerOfTen(4),
    () => BigNum.valueOf(2).scaleByPowerOfTen(-2),
    () => BigNum.valueOf(2).scaleByPowerOfTen(-3),
    () => BigNum.valueOf(2).scaleByPowerOfTen(-4),
    () => BigNum.valueOf(0.2).scaleByPowerOfTen(2),
    () => BigNum.valueOf(0.2).scaleByPowerOfTen(3),
    () => BigNum.valueOf(0.2).scaleByPowerOfTen(4),
    () => BigNum.valueOf(2).scaleByPowerOfTen(-2),
    () => BigNum.valueOf(2).scaleByPowerOfTen(-3),
    () => BigNum.valueOf(2).scaleByPowerOfTen(-4),
    () => BigNum.valueOf(4).scaleByPowerOfTen(2.5),
    () => BigNum.valueOf(2).scaleByPowerOfTen(2.2),
    () => BigNum.valueOf(NaN).scaleByPowerOfTen(3),
    () => BigNum.valueOf(3).scaleByPowerOfTen(NaN),
    () => BigNum.valueOf(NaN).scaleByPowerOfTen(NaN),
    () => BigNum.valueOf(Infinity).scaleByPowerOfTen(1),
    () => BigNum.valueOf(-Infinity).scaleByPowerOfTen(1),
    () => BigNum.valueOf(1).scaleByPowerOfTen(Infinity),
    () => BigNum.valueOf(1).scaleByPowerOfTen(-Infinity),
    () => BigNum.valueOf(Infinity).scaleByPowerOfTen(Infinity),
    () => BigNum.valueOf(-Infinity).scaleByPowerOfTen(Infinity),
    () => BigNum.valueOf(Infinity).scaleByPowerOfTen(-Infinity),
    () => BigNum.valueOf(-Infinity).scaleByPowerOfTen(-Infinity),
    // sqrt
    () => BigNum.valueOf(2).sqrt(),
    () => BigNum.valueOf(3).sqrt(),
    () => BigNum.valueOf(4).sqrt(),
    () => BigNum.valueOf(5).sqrt(),
    () => BigNum.valueOf(6).sqrt(),
    () => BigNum.valueOf(7).sqrt(),
    () => BigNum.valueOf(8).sqrt(),
    () => BigNum.valueOf(9).sqrt(),
    () => BigNum.valueOf(10).sqrt(),
    () => BigNum.valueOf(271441).sqrt(),
    () => BigNum.valueOf(2.25).sqrt(),
    () => BigNum.valueOf(0.5625).sqrt(),
    () => BigNum.valueOf(0.0145).sqrt(),
    () => BigNum.valueOf(22.25).sqrt(),
    () => BigNum.valueOf(1.499).sqrt(),
    () => BigNum.valueOf(1.5).sqrt(),
    () => BigNum.valueOf(1.501).sqrt(),
    () => BigNum.valueOf(0).sqrt(),
    () => BigNum.valueOf(NaN).sqrt(),
    () => BigNum.valueOf(Infinity).sqrt(),
    () => BigNum.valueOf(-Infinity).sqrt(),
    // nthRoot
    () => BigNum.valueOf(2).nthRoot(2),
    () => BigNum.valueOf(2).nthRoot(3),
    () => BigNum.valueOf(2).nthRoot(4),
    () => BigNum.valueOf(2).nthRoot(-2),
    () => BigNum.valueOf(2).nthRoot(-3),
    () => BigNum.valueOf(2).nthRoot(-4),
    () => BigNum.valueOf(0.2).nthRoot(2),
    () => BigNum.valueOf(0.2).nthRoot(3),
    () => BigNum.valueOf(0.2).nthRoot(4),
    () => BigNum.valueOf(0.2).nthRoot(-2),
    () => BigNum.valueOf(0.2).nthRoot(-3),
    () => BigNum.valueOf(0.2).nthRoot(-4),
    () => BigNum.valueOf(0.2).nthRoot(BigNum.valueOf(0.2).add(3.8)),
    () => BigNum.valueOf(3).nthRoot(0.25),
    () => BigNum.valueOf(3).nthRoot(-0.25),
    () => BigNum.valueOf(3).nthRoot(2.25),
    () => BigNum.valueOf(3).nthRoot(-2.25),
    () =>
      // 2 ** (1/(1/3))
      BigNum.valueOf(2).nthRoot(BigNum.valueOf(1).divide(3)),
    () => BigNum.valueOf(NaN).nthRoot(3),
    () => BigNum.valueOf(3).nthRoot(NaN),
    () => BigNum.valueOf(NaN).nthRoot(-3),
    () => BigNum.valueOf(NaN).nthRoot(NaN),
    () => BigNum.valueOf(Infinity).nthRoot(2),
    () => BigNum.valueOf(-Infinity).nthRoot(2),
    () => BigNum.valueOf(Infinity).nthRoot(-2),
    () => BigNum.valueOf(-Infinity).nthRoot(-2),
    () => BigNum.valueOf(2).nthRoot(Infinity),
    () => BigNum.valueOf(2).nthRoot(-Infinity),
    () => BigNum.valueOf(Infinity).nthRoot(Infinity),
    () => BigNum.valueOf(-Infinity).nthRoot(Infinity),
    () => BigNum.valueOf(Infinity).nthRoot(-Infinity),
    () => BigNum.valueOf(-Infinity).nthRoot(-Infinity),
    // trunc
    () => BigNum.valueOf(1).trunc(),
    () => BigNum.valueOf(1.499).trunc(),
    () => BigNum.valueOf(1.5).trunc(),
    () => BigNum.valueOf(1.501).trunc(),
    () => BigNum.valueOf(0).trunc(),
    () => BigNum.valueOf(-1).trunc(),
    () => BigNum.valueOf(-1.499).trunc(),
    () => BigNum.valueOf(-1.5).trunc(),
    () => BigNum.valueOf(-1.501).trunc(),
    () => BigNum.valueOf(-0).trunc(),
    () => BigNum.valueOf(NaN).trunc(),
    () => BigNum.valueOf(Infinity).trunc(),
    () => BigNum.valueOf(-Infinity).trunc(),
    // round
    () => BigNum.valueOf(1).round(),
    () => BigNum.valueOf(1.499).round(),
    () => BigNum.valueOf(1.5).round(),
    () => BigNum.valueOf(1.501).round(),
    () => BigNum.valueOf(0).round(),
    () => BigNum.valueOf(-1).round(),
    () => BigNum.valueOf(-1.499).round(),
    () => BigNum.valueOf(-1.5).round(),
    () => BigNum.valueOf(-1.501).round(),
    () => BigNum.valueOf(-0).round(),
    () => BigNum.valueOf("-.1").multiply(10).round(),
    () => BigNum.valueOf(".1").multiply(10).round(),
    () => BigNum.valueOf("-.1").multiply(5).round(),
    () => BigNum.valueOf(".1").multiply(5).round(),
    () => BigNum.valueOf(NaN).round(),
    () => BigNum.valueOf(Infinity).round(),
    () => BigNum.valueOf(-Infinity).round(),
    // floor
    () => BigNum.valueOf(1).floor(),
    () => BigNum.valueOf(1.499).floor(),
    () => BigNum.valueOf(1.5).floor(),
    () => BigNum.valueOf(1.501).floor(),
    () => BigNum.valueOf(0).floor(),
    () => BigNum.valueOf(-1).floor(),
    () => BigNum.valueOf(-1.499).floor(),
    () => BigNum.valueOf(-1.5).floor(),
    () => BigNum.valueOf(-1.501).floor(),
    () => BigNum.valueOf(-0).floor(),
    () => BigNum.valueOf("-.1").multiply(10).floor(),
    () => BigNum.valueOf(NaN).floor(),
    () => BigNum.valueOf(Infinity).floor(),
    () => BigNum.valueOf(-Infinity).floor(),
    // ceil
    () => BigNum.valueOf(1).ceil(),
    () => BigNum.valueOf(1.499).ceil(),
    () => BigNum.valueOf(1.5).ceil(),
    () => BigNum.valueOf(1.501).ceil(),
    () => BigNum.valueOf(0).ceil(),
    () => BigNum.valueOf(-1).ceil(),
    () => BigNum.valueOf(-1.499).ceil(),
    () => BigNum.valueOf(-1.5).ceil(),
    () => BigNum.valueOf(-1.501).ceil(),
    () => BigNum.valueOf(-0).ceil(),
    () => BigNum.valueOf(".1").multiply(10).ceil(),
    () => BigNum.valueOf(NaN).ceil(),
    () => BigNum.valueOf(Infinity).ceil(),
    () => BigNum.valueOf(-Infinity).ceil(),
    // compareTo
    () => BigNum.valueOf(0.001).compareTo(0.001),
    () => BigNum.valueOf(0.001).compareTo(0.002),
    () => BigNum.valueOf(0.002).compareTo(0.001),
    () => BigNum.valueOf(NaN).compareTo(3),
    () => BigNum.valueOf(3).compareTo(NaN),
    () => BigNum.valueOf(NaN).compareTo(NaN),
    () => BigNum.valueOf(Infinity).compareTo(Infinity),
    () => BigNum.valueOf(-Infinity).compareTo(Infinity),
    () => BigNum.valueOf(Infinity).compareTo(-Infinity),
    () => BigNum.valueOf(-Infinity).compareTo(-Infinity),
    () => BigNum.valueOf(0).compareTo(Infinity),
    () => BigNum.valueOf(0).compareTo(-Infinity),
    () => BigNum.valueOf(Infinity).compareTo(0),
    () => BigNum.valueOf(-Infinity).compareTo(0),
    // isNaN
    () => BigNum.valueOf(123.456).isNaN(),
    () => BigNum.valueOf(NaN).isNaN(),
    () => BigNum.valueOf(Infinity).isNaN(),
    () => BigNum.valueOf(-Infinity).isNaN(),
  ]) {
    it(String(t), () => {
      const r = t();
      chai
        .expect(
          (typeof r === "object"
            ? r.isNaN()
              ? "NaN"
              : !r.isFinite()
                ? r.toString()
                : null
            : typeof r === "number" && isNaN(r)
              ? "NaN"
              : null) ?? JSON.stringify(r),
        )
        .toMatchSnapshot();
    });
  }
});

describe("Infinity tests", () => {
  for (const t of B_TESTS) {
    for (const a of [Infinity, -Infinity]) {
      for (const b of [3, 1, 0.5, 0, -0.5, -1, -3, Infinity, -Infinity]) {
        [[a, b], ...(a === b ? [] : [[b, a]])].forEach(([a, b]) => {
          if (t.ignore?.(a, b)) return;
          const name =
            typeof t.op === "function" ? t.op(a, b) : `${a} ${t.op} ${b}`;
          it(name, () => {
            const ba = new BigNum(a);
            const bb = new BigNum(b);
            assert.strictEqual(`${t.b(ba, bb)}`, `${t.n(a, b)}`);
          });
        });
      }
    }
  }
  for (const t of U_TESTS) {
    [Infinity, -Infinity].forEach((a) => {
      if (t.ignore?.(Number(a))) return;
      it(`${t.fn}(${a})`, () => {
        const ba = new BigNum(a);
        assert.strictEqual(`${t.b(ba)}`, `${t.n(a)}`);
      });
    });
  }
});

describe("Random tests", () => {
  for (const t of B_TESTS) {
    const set = new Set<number>();
    for (let index = 0; index < 1000; index++) {
      const a = random(set);
      const b = random(set);
      [[a, b], ...(a === b ? [] : [[b, a]])].forEach(([a, b]) => {
        if (t.ignore?.(a, b)) return;
        const name =
          typeof t.op === "function" ? t.op(a, b) : `${a} ${t.op} ${b}`;
        it(name, () => {
          const ba = new BigNum(a);
          const bb = new BigNum(b);
          const actual = t.b(ba, bb);
          const expect = t.n(a, b);
          lazyAssert(actual, expect);
        });
      });
    }
  }
  for (const t of U_TESTS) {
    const set = new Set<number>();
    for (let index = 0; index < 1000; index++) {
      const a = random(set);
      if (t.ignore?.(Number(a))) return;
      it(`${t.fn}(${a})`, () => {
        const ba = new BigNum(a);
        const actual = t.b(ba);
        const expect = t.n(a);
        lazyAssert(actual, expect);
      });
    }
  }

  /**
   * Get random number
   */
  function random(set: Set<number>) {
    let v: number;
    while (
      set.has((v = Math.floor(Math.random() * 300000000 - 1500000000) / 100000))
    );
    return v;
  }
});

/**
 * Lazy assert function
 */
function lazyAssert(actual: BigNum, expect: number | bigint) {
  if (!actual.isFinite()) {
    assert.strictEqual(`${actual}`, `${expect}`);
    return;
  }
  const diff = actual.subtract(expect).abs();
  if (diff.signum() === 0) {
    assert.ok(diff.signum() === 0, `${actual} === ${expect}`);
    return;
  }
  const tolerance = actual.abs().divide(1000000000, {
    overflow: (ctx) => ctx.scale > 0n && ctx.precision > 20n,
  });
  assert.ok(
    tolerance.negate().compareTo(diff) <= 0 && diff.compareTo(tolerance) <= 0,
    `Lazy comparison. Actual=${actual} Expect=${expect} Tolerance=${tolerance}`,
  );
}
