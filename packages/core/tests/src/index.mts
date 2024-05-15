import chai, { assert } from "chai";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import { BigNum } from "../../src/index.mjs";

chai.use(jestSnapshotPlugin());
describe("standard tests", () => {
  for (const t of [
    () => 1,
    () => 1.1,
    () => 2.1,
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
    // pow
    () => BigNum.valueOf(2).pow(2),
    () => BigNum.valueOf(2).pow(3),
    () => BigNum.valueOf(2).pow(4),
    () => BigNum.valueOf(0.2).pow(2),
    () => BigNum.valueOf(0.2).pow(3),
    () => BigNum.valueOf(0.2).pow(4),
    () => BigNum.valueOf(0.2).pow(BigNum.valueOf(0.2).add(3.8)),
    () => BigNum.valueOf(NaN).pow(3),
    () => BigNum.valueOf(3).pow(NaN),
    () => BigNum.valueOf(NaN).pow(NaN),
    () => BigNum.valueOf(Infinity).pow(2),
    () => BigNum.valueOf(-Infinity).pow(2),
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
    () => BigNum.valueOf(0.2).scaleByPowerOfTen(2),
    () => BigNum.valueOf(0.2).scaleByPowerOfTen(3),
    () => BigNum.valueOf(0.2).scaleByPowerOfTen(4),
    () => BigNum.valueOf(2).scaleByPowerOfTen(-2),
    () => BigNum.valueOf(2).scaleByPowerOfTen(-3),
    () => BigNum.valueOf(2).scaleByPowerOfTen(-4),
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
  for (const t of [
    {
      op: "+",
      n: (a: number, b: number) => a + b,
      b: (a: BigNum, b: BigNum) => a.add(b),
    },
    {
      op: "-",
      n: (a: number, b: number) => a - b,
      b: (a: BigNum, b: BigNum) => a.subtract(b),
    },
    {
      op: "*",
      n: (a: number, b: number) => a * b,
      b: (a: BigNum, b: BigNum) => a.multiply(b),
    },
    {
      op: "/",
      n: (a: number, b: number) => a / b,
      b: (a: BigNum, b: BigNum) => a.divide(b),
    },
    {
      op: "%",
      n: (a: number, b: number) => a % b,
      b: (a: BigNum, b: BigNum) => a.modulo(b),
    },
    {
      op: "**",
      n: (a: number, b: number) => a ** b,
      b: (a: BigNum, b: BigNum) => a.pow(b),
    },
    {
      op: "* 10 **",
      n: (a: number, b: number) => a * 10 ** b,
      b: (a: BigNum, b: BigNum) => a.scaleByPowerOfTen(b),
      ignore: (_a: number, b: number) => b < 0,
    },
    {
      op: "compareTo",
      n: (a: number, b: number) => (a === b ? 0 : a > b ? 1 : a < b ? -1 : NaN),
      b: (a: BigNum, b: BigNum) => a.compareTo(b),
    },
  ] satisfies {
    op: string;
    n: (a: number, b: number) => number;
    b: (a: BigNum, b: BigNum) => BigNum | number;
    ignore?: (a: number, b: number) => boolean;
  }[]) {
    [Infinity, -Infinity].forEach((a) => {
      [3, 1, 0, -1, -3, Infinity, -Infinity].forEach((b) => {
        [[a, b], ...(a === b ? [] : [[b, a]])].forEach(([a, b]) => {
          if (t.ignore?.(a, b)) return;
          it(`${a} ${t.op} ${b}`, () => {
            const ba = new BigNum(a);
            const bb = new BigNum(b);
            assert.strictEqual(`${t.b(ba, bb)}`, `${t.n(a, b)}`);
          });
        });
      });
    });
  }
  for (const t of [
    {
      fn: "negate",
      n: (a: number) => -a,
      b: (a: BigNum) => a.negate(),
    },
    {
      fn: "abs",
      n: (a: number) => Math.abs(a),
      b: (a: BigNum) => a.abs(),
    },
    {
      fn: "trunc",
      n: (a: number) => Math.trunc(a),
      b: (a: BigNum) => a.trunc(),
    },
    {
      fn: "round",
      n: (a: number) => Math.round(a),
      b: (a: BigNum) => a.round(),
    },
    {
      fn: "ceil",
      n: (a: number) => Math.ceil(a),
      b: (a: BigNum) => a.ceil(),
    },
    {
      fn: "floor",
      n: (a: number) => Math.floor(a),
      b: (a: BigNum) => a.floor(),
    },
  ] satisfies {
    fn: string;
    n: (a: number) => number;
    b: (a: BigNum) => BigNum | number;
  }[]) {
    [Infinity, -Infinity].forEach((a) => {
      it(`${t.fn}(${a})`, () => {
        const ba = new BigNum(a);
        assert.strictEqual(`${t.b(ba)}`, `${t.n(a)}`);
      });
    });
  }
});

describe("Random tests", () => {
  for (const t of [
    {
      op: "+",
      n: (a: number, b: number) => a + b,
      b: (a: BigNum, b: BigNum) => a.add(b),
    },
    {
      op: "-",
      n: (a: number, b: number) => a - b,
      b: (a: BigNum, b: BigNum) => a.subtract(b),
    },
    {
      op: "*",
      n: (a: number, b: number) => a * b,
      b: (a: BigNum, b: BigNum) => a.multiply(b),
    },
    {
      op: "/",
      n: (a: number, b: number) => a / b,
      b: (a: BigNum, b: BigNum) => a.divide(b),
    },
    {
      op: "%",
      n: (a: number, b: number) => a % b,
      b: (a: BigNum, b: BigNum) => a.modulo(b),
    },
    {
      op: "**",
      n: (a: number, b: number) => a ** b,
      b: (a: BigNum, b: BigNum) => a.pow(b),
      ignore: (_a: number, b: number) => b < 0 || !Number.isInteger(b),
    },
    {
      op: "* 10 **",
      n: (a: number, b: number) => a * 10 ** b,
      b: (a: BigNum, b: BigNum) => a.scaleByPowerOfTen(b),
      ignore: (_a: number, b: number) => b < 0 || !Number.isInteger(b),
    },
    {
      op: "compareTo",
      n: (a: number, b: number) => (a === b ? 0 : a > b ? 1 : a < b ? -1 : NaN),
      b: (a: BigNum, b: BigNum) => a.compareTo(b),
    },
  ] satisfies {
    op: string;
    n: (a: number, b: number) => number;
    b: (a: BigNum, b: BigNum) => BigNum | number;
    ignore?: (a: number, b: number) => boolean;
  }[]) {
    const set = new Set<number>();
    for (let index = 0; index < 30; index++) {
      const a = random(set);
      const b = random(set);
      [[a, b], ...(a === b ? [] : [[b, a]])].forEach(([a, b]) => {
        if (t.ignore?.(a, b)) return;
        it(`${a} ${t.op} ${b}`, () => {
          const ba = new BigNum(a);
          const bb = new BigNum(b);
          const actual = t.b(ba, bb);
          const expect = t.n(a, b);
          assert.ok(
            Number(actual) - Number(expect) <= 0.0000001,
            `${actual} === ${expect}`,
          );
        });
      });
    }
  }
  for (const t of [
    {
      fn: "negate",
      n: (a: number) => -a,
      b: (a: BigNum) => a.negate(),
    },
    {
      fn: "abs",
      n: (a: number) => Math.abs(a),
      b: (a: BigNum) => a.abs(),
    },
    {
      fn: "trunc",
      n: (a: number) => Math.trunc(a),
      b: (a: BigNum) => a.trunc(),
    },
    {
      fn: "round",
      n: (a: number) => Math.round(a),
      b: (a: BigNum) => a.round(),
    },
    {
      fn: "ceil",
      n: (a: number) => Math.ceil(a),
      b: (a: BigNum) => a.ceil(),
    },
    {
      fn: "floor",
      n: (a: number) => Math.floor(a),
      b: (a: BigNum) => a.floor(),
    },
  ] satisfies {
    fn: string;
    n: (a: number) => number;
    b: (a: BigNum) => BigNum | number;
  }[]) {
    const set = new Set<number>();
    for (let index = 0; index < 30; index++) {
      const a = random(set);
      it(`${t.fn}(${a})`, () => {
        const ba = new BigNum(a);
        const actual = t.b(ba);
        const expect = t.n(a);
        assert.ok(
          Number(actual) - Number(expect) <= 0.0000001,
          `${actual} === ${expect}`,
        );
      });
    }
  }

  function random(set: Set<number>) {
    let v: number;
    while (set.has((v = Math.floor(Math.random() * 300000 - 150000) / 1000)));
    return v;
  }
});
