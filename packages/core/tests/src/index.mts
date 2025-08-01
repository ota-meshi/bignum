/* eslint @typescript-eslint/no-shadow: 0 -- ignore check */
import { BigNum } from "../../src/index.mjs";
import assert from "assert";
import * as snap from "@ota-meshi/test-snapshot";
import { Decimal } from "decimal.js";
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});
type BTest = {
  op: string | ((a: number, b: number) => string);
  n: (a: number, b: number) => number | string;
  b: (a: BigNum, b: BigNum) => BigNum;
  ignore?: (a: number, b: number) => boolean;
};
const B_TESTS: BTest[] = [
  {
    op: "+",
    n: (a, b) => new Decimal(a).add(b).toString(),
    b: (a: BigNum, b: BigNum) => a.add(b),
  },
  {
    op: "-",
    n: (a, b) => new Decimal(a).sub(b).toString(),
    b: (a: BigNum, b: BigNum) => a.subtract(b),
  },
  {
    op: "*",
    n: (a, b) => new Decimal(a).mul(b).toString(),
    b: (a: BigNum, b: BigNum) => a.multiply(b),
  },
  {
    op: "/",
    n: (a, b) => new Decimal(a).div(b).toString(),
    b: (a: BigNum, b: BigNum) => a.divide(b),
  },
  {
    op: "%",
    n: (a, b) => new Decimal(a).mod(b).toString(),
    b: (a: BigNum, b: BigNum) => a.modulo(b),
  },
  {
    op: "**",
    n: (a, b) => new Decimal(a).pow(b).toString(),
    b: (a: BigNum, b: BigNum) => a.pow(b),
    ignore: (a, b) => {
      if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
      const abs = Math.abs(b);
      if (abs && (abs > 1000 || abs < 0.001)) return true;
      if (String(abs).length > 5) return true;
      return false;
    },
  },
  {
    op: "* 10 **",
    n: (a, b) => new Decimal(a).mul(new Decimal(10).pow(b)).toString(),
    b: (a: BigNum, b: BigNum) => a.scaleByPowerOfTen(b),
    ignore: (a, b) => {
      if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
      const abs = Math.abs(b);
      if (String(abs).length > 5) return true;
      return false;
    },
  },
  {
    op: (a, b) => `${a} ** (1/${b})`,
    n: (a, b) => new Decimal(a).pow(new Decimal(1).div(b)).toString(),
    b: (a: BigNum, b: BigNum) => a.nthRoot(b),
    ignore: (a, b) => {
      if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
      const abs = Math.abs(b);
      if (String(abs).length > 5) return true;
      if (String(abs).length >= 5 && String(a).length >= 9) return true;
      return false;
    },
  },
  {
    // use pow for nthRoot
    op: (a, b) => `${a} ** /*pow*/ (1/${b})`,
    n: (a, b) => new Decimal(a).pow(new Decimal(1).div(b)).toString(),
    b: (a: BigNum, b: BigNum) => a.pow(BigNum.valueOf(1).divide(b)),
    ignore: (a, b) =>
      Number.isFinite(a) &&
      Number.isFinite(b) &&
      (a < 0 || String(b).length > 5),
  },
  {
    op: "compareTo",
    n: (a, b) => (a === b ? 0 : a > b ? 1 : a < b ? -1 : NaN),
    b: (a: BigNum, b: BigNum) => BigNum.valueOf(a.compareTo(b)),
  },
];

type UTest = {
  fn: string | ((a: number) => string);
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
  },
  {
    fn: (a) => `${a} ** (1/2)`,
    // eslint-disable-next-line math/prefer-math-sqrt -- ignore for test
    n: (a) => a ** 0.5,
    b: (a: BigNum) => a.nthRoot(2),
  },
  {
    fn: (a) => `${a} ** (1/4)`,
    n: (a) => a ** 0.25,
    b: (a: BigNum) => a.nthRoot(4),
  },
];

describe("Calc tests", () => {
  for (const t of B_TESTS) {
    for (const [a, b] of [
      [-2, -1],
      [2, -1],
      [-686.03129, -114],
      [134.25081, -315],
      [3, 2.25],
      [-1.23e-42, 1],
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
      [-3, 0],
      [3, 0],
      [5, -5],
      [1.1, -2.2],
      [-873.03785, -110],
      [-1.38016, -539],
      [0.97595, 771],
      [974.79177, -318],
      [8.7411, 274],
      [-135.22035, -321],
      [-706.23193, -112],
      [683.28419, 7],
      [890.14454, -88.87],
      [-587.74778, -319],
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
          lazyAssert(name, actual, expect);
          snap.expect(JSON.stringify(actual)).toMatchSnapshot();
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
      const name =
        typeof t.fn === "function" ? t.fn(Number(a)) : `${t.fn}(${a})`;
      it(name, () => {
        const ba = new BigNum(a);
        const actual = t.b(ba);
        const expect = t.n(Number(a));
        lazyAssert(name, actual, expect);
        snap.expect(JSON.stringify(actual)).toMatchSnapshot();
      });
    }
  }
});

describe("Infinity tests", () => {
  for (const t of B_TESTS) {
    for (const a of [Infinity, -Infinity]) {
      for (const b of [
        3,
        2,
        1,
        0.5,
        0,
        -0.5,
        -1,
        -2,
        -3,
        Infinity,
        -Infinity,
      ]) {
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
      const name = typeof t.fn === "function" ? t.fn(a) : `${t.fn}(${a})`;
      it(name, () => {
        const ba = new BigNum(a);
        assert.strictEqual(`${t.b(ba)}`, `${t.n(a)}`);
      });
    });
  }
});

describe("Random tests", () => {
  const randomCount = 100;
  for (const t of B_TESTS) {
    const set = new Set<number>();
    for (let index = 0; index < randomCount; index++) {
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
          lazyAssert(name, actual, expect);
        });
      });
    }
  }
  for (const t of U_TESTS) {
    const set = new Set<number>();
    for (let index = 0; index < randomCount; index++) {
      const a = random(set);
      if (t.ignore?.(Number(a))) return;
      const name = typeof t.fn === "function" ? t.fn(a) : `${t.fn}(${a})`;
      it(name, () => {
        const ba = new BigNum(a);
        const actual = t.b(ba);
        const expect = t.n(a);
        lazyAssert(name, actual, expect);
      });
    }
  }

  /**
   * Get random number
   */
  function random(set: Set<number>) {
    let v: number;
    while (
      set.has(
        (v =
          Math.random() > 0.2
            ? Math.floor(Math.random() * 300000000 - 150000000) / 100000
            : Math.floor(Math.random() * 3000 - 1500)),
      )
    );
    return v;
  }
});

/**
 * Lazy assert function
 */
function lazyAssert(name: string, actual: BigNum, expect: number | string) {
  if (!actual.isFinite()) {
    assert.strictEqual(`${actual}`, `${expect}`);
    return;
  }
  if (expect === 0) {
    const tolerance = new BigNum(1).divide(10000000000000);
    assert.ok(
      tolerance.negate().compareTo(actual) <= 0 &&
        actual.compareTo(tolerance) <= 0,
      `Lazy comparison for 0. Actual=${actual} Expect=${expect} Tolerance=${tolerance}`,
    );
    return;
  }
  if (expect === Infinity) {
    assert.strictEqual(
      actual.signum(),
      1,
      `Check signum. Actual=${actual} Expect=${expect}`,
    );
    assert.ok(
      actual.compareTo(Number.MAX_VALUE) > 0,
      `Lazy comparison for Infinity. Actual=${actual} Expect=${expect}`,
    );
    return;
  }
  if (expect === -Infinity) {
    assert.strictEqual(
      actual.signum(),
      -1,
      `Check signum. Actual=${actual} Expect=${expect}`,
    );
    assert.ok(
      actual.compareTo(Number.MIN_VALUE) < 0,
      `Lazy comparison for Infinity. Actual=${actual} Expect=${expect}`,
    );
    return;
  }
  if (expect === 1) {
    assert.strictEqual(
      Number(`${actual}`),
      expect,
      `Lazy comparison for 1. Actual=${actual} Expect=${expect}`,
    );
    return;
  }
  const diff = actual.subtract(expect).abs();
  if (diff.signum() === 0) {
    assert.ok(diff.signum() === 0, `${actual} === ${expect}`);
    return;
  }

  const diffRatio = diff.divide(expect).abs();
  const diffChars = [
    ...`${" ".repeat(`${actual}`.split(".")[0].length - `${diff}`.split(".")[0].length)}${diff}`,
  ];

  const message = `Lazy comparison.
Expression=${name}
Actual(BigNum)=
${actual}
Expect(BigNum)=
${BigNum.valueOf(expect)}
Diff=
${diffChars.join("")}
Expect(number)=
${expect}
DiffRatio=
${diffRatio}
`;

  const threshold = 1e-15;
  if (diffRatio.compareTo(threshold) >= 0) {
    console.log(message);
  }
  assert.ok(diffRatio.compareTo(threshold) < 0, message);
}
