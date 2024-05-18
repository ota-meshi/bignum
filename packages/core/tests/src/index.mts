/* eslint @typescript-eslint/no-shadow: 0 -- ignore check */
import { assert } from "chai";
import { BigNum } from "../../src/index.mjs";

type BTest = {
  op: string | ((a: number, b: number) => string);
  n: (a: number, b: number) => number;
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
    ignore: (a, b) => {
      if (!isFinite(a) || !isFinite(b)) return false;
      const abs = Math.abs(b);
      if (abs && (abs > 1000 || abs < 0.001)) return true;
      if (String(abs).includes(".") && String(abs).length > 5) return true;
      return false;
    },
  },
  {
    op: "* 10 **",
    n: (a, b) => a * 10 ** b,
    b: (a: BigNum, b: BigNum) => a.scaleByPowerOfTen(b),
    ignore: (a, b) => {
      if (!isFinite(a) || !isFinite(b)) return false;
      const abs = Math.abs(b);
      if (String(abs).length > 5) return true;
      return false;
    },
  },
  {
    op: (a, b) => `${a} ** (1/${b})`,
    n: (a, b) => a ** (1 / b),
    b: (a: BigNum, b: BigNum) => a.nthRoot(b),
    ignore: (a, b) => {
      if (!isFinite(a) || !isFinite(b)) return false;
      const abs = Math.abs(b);
      if (String(abs).length > 5) return true;
      return false;
    },
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
  },
];

describe("Calc tests", () => {
  for (const t of B_TESTS) {
    for (const [a, b] of [
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
function lazyAssert(actual: BigNum, expect: number) {
  if (!actual.isFinite()) {
    assert.strictEqual(`${actual}`, `${expect}`);
    return;
  }
  if (expect === 0) {
    const tolerance = new BigNum(1).divide(10000000000000);
    assert.ok(
      tolerance.negate().compareTo(actual) <= 0 &&
        actual.compareTo(tolerance) <= 0,
      `Lazy comparison. Actual=${actual} Expect=${expect} Tolerance=${tolerance}`,
    );
    return;
  }
  const diff = actual.subtract(expect).abs();
  if (diff.signum() === 0) {
    assert.ok(diff.signum() === 0, `${actual} === ${expect}`);
    return;
  }
  const tolerance = actual.abs().divide(1000000000);
  assert.ok(
    tolerance.negate().compareTo(diff) <= 0 && diff.compareTo(tolerance) <= 0,
    `Lazy comparison. Actual=${actual} Expect=${expect} Tolerance=${tolerance} Diff=${diff}`,
  );
}
