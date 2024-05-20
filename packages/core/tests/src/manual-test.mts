import chai from "chai";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import { BigNum, RoundingMode } from "../../src/index.mjs";
import { stringify } from "../../../test/src/index.mjs";
import { BigNumBasic } from "../../src/impl/bignum-basic.mts";

chai.use(jestSnapshotPlugin());
describe("standard tests", () => {
  for (const t of [
    () => BigNum.valueOf(0.2).add(0.1),
    () => BigNum.valueOf(2).multiply(0.1).add(0.1),
    () => BigNum.valueOf("2e2").divide(1000).add(0.1),
    // add
    () => BigNum.valueOf(1.1).add(-2.2),
    () => BigNum.valueOf(0.02).add(0.1),
    () => BigNum.valueOf(0.2).add(0.01),
    () => {
      // (1/3 + 1/6) * (1/3 + 1/6) * 4
      const a = BigNum.valueOf(1).divide(3);
      const b = BigNum.valueOf(1).divide(6);
      return a.add(b).multiply(a.add(b)).multiply(4);
    },
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
    () => BigNum.valueOf(2.3).divide(1.1),
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
    () => BigNum.valueOf(0.000009).sqrt(),
    () => BigNum.valueOf(0.00001024).sqrt(),
    () => BigNum.valueOf(0.0145).sqrt(),
    () => BigNum.valueOf(22.25).sqrt(),
    () => BigNum.valueOf(1.499).sqrt(),
    () => BigNum.valueOf(1.5).sqrt(),
    () => BigNum.valueOf(1.501).sqrt(),
    () => BigNum.valueOf(0).sqrt(),
    () => {
      // Math.sqrt(2)
      return [
        BigNum.valueOf(2).sqrt({ roundingMode: RoundingMode.trunc }),
        BigNum.valueOf(2).sqrt({ roundingMode: RoundingMode.round }),
        BigNum.valueOf(2).sqrt({ roundingMode: RoundingMode.floor }),
        BigNum.valueOf(2).sqrt({ roundingMode: RoundingMode.ceil }),
      ];
    },
    () =>
      // Math.sqrt(2) ** 2
      BigNum.valueOf(2).sqrt({ roundingMode: RoundingMode.round }).pow(2),
    () => {
      // Math.sqrt(3)
      return [
        BigNum.valueOf(3).sqrt({ roundingMode: RoundingMode.trunc }),
        BigNum.valueOf(3).sqrt({ roundingMode: RoundingMode.round }),
        BigNum.valueOf(3).sqrt({ roundingMode: RoundingMode.floor }),
        BigNum.valueOf(3).sqrt({ roundingMode: RoundingMode.ceil }),
      ];
    },
    () => {
      // Math.sqrt(5)
      return [
        BigNum.valueOf(5).sqrt({ roundingMode: RoundingMode.trunc }),
        BigNum.valueOf(5).sqrt({ roundingMode: RoundingMode.round }),
        BigNum.valueOf(5).sqrt({ roundingMode: RoundingMode.floor }),
        BigNum.valueOf(5).sqrt({ roundingMode: RoundingMode.ceil }),
      ];
    },
    () => {
      // Math.sqrt(6)
      return [
        BigNum.valueOf(6).sqrt({ roundingMode: RoundingMode.trunc }),
        BigNum.valueOf(6).sqrt({ roundingMode: RoundingMode.round }),
        BigNum.valueOf(6).sqrt({ roundingMode: RoundingMode.floor }),
        BigNum.valueOf(6).sqrt({ roundingMode: RoundingMode.ceil }),
      ];
    },
    () => {
      // Math.sqrt(7)
      return [
        BigNum.valueOf(7).sqrt({ roundingMode: RoundingMode.trunc }),
        BigNum.valueOf(7).sqrt({ roundingMode: RoundingMode.round }),
        BigNum.valueOf(7).sqrt({ roundingMode: RoundingMode.floor }),
        BigNum.valueOf(7).sqrt({ roundingMode: RoundingMode.ceil }),
      ];
    },
    () =>
      // Math.sqrt(-2)
      BigNum.valueOf(-2).sqrt(),
    () => BigNum.valueOf(NaN).sqrt(),
    () => BigNum.valueOf(Infinity).sqrt(),
    () => BigNum.valueOf(-Infinity).sqrt(),
    // nthRoot
    () => BigNum.valueOf(1000).nthRoot(3),
    () => BigNum.valueOf(512).nthRoot(3),
    () => BigNum.valueOf(27).nthRoot(3),
    () => BigNum.valueOf(8).nthRoot(3),
    () => BigNum.valueOf(0.125).nthRoot(3),
    () => BigNum.valueOf(0.064).nthRoot(3),
    () => BigNum.valueOf(0.008).nthRoot(3),
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
    () => {
      // (3 ** (1/2))
      return [
        BigNum.valueOf(6).nthRoot(2, { roundingMode: RoundingMode.trunc }),
        BigNum.valueOf(6).nthRoot(2, { roundingMode: RoundingMode.round }),
        BigNum.valueOf(6).nthRoot(2, { roundingMode: RoundingMode.floor }),
        BigNum.valueOf(6).nthRoot(2, { roundingMode: RoundingMode.ceil }),
      ];
    },
    () =>
      // (-2) ** (1 / 2)
      BigNum.valueOf(-2).nthRoot(2),
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
    // isFinite
    () => BigNum.valueOf(123.456).isFinite(),
    () => BigNum.valueOf(NaN).isFinite(),
    () => BigNum.valueOf(Infinity).isFinite(),
    () => BigNum.valueOf(-Infinity).isFinite(),
    // toJSON
    () => JSON.stringify(BigNum.valueOf(123.456)),
    () => JSON.stringify(BigNum.valueOf(NaN)),
    () => JSON.stringify(BigNum.valueOf(Infinity)),
    () => JSON.stringify(BigNum.valueOf(-Infinity)),
    () => JSON.stringify(BigNum.valueOf(1).divide(3)),
    () => BigNum.valueOf(123.456).toJSON(),
    () => BigNum.valueOf(NaN).toJSON(),
    () => BigNum.valueOf(Infinity).toJSON(),
    () => BigNum.valueOf(-Infinity).toJSON(),
    () => BigNum.valueOf(1).divide(3).toJSON(),
    // Others
    () => {
      const v = BigNum.valueOf(123.456);
      // Same instance
      return v === BigNum.valueOf(v);
    },
    () => {
      const v = BigNum.valueOf(123.456);
      // Same instance
      return v === new BigNum(v);
    },
    () => {
      const v = BigNumBasic.valueOf(123.456);
      // Not same instance
      return v === new BigNum(v);
    },
    () => BigNum.valueOf(null as any),
    () => BigNum.valueOf("foo"),
    () => BigNum.valueOf("+"),
    () => BigNum.valueOf("-"),
    () => BigNum.valueOf("."),
    () => BigNum.valueOf("+."),
    () => BigNum.valueOf("-."),
    () => BigNum.valueOf("+.1"),
    () => BigNum.valueOf("-.1"),
    () => BigNum.valueOf("+.0"),
    () => BigNum.valueOf("-.0"),
    () => BigNum.valueOf("6.758057543099835e+41"),
    () => BigNum.valueOf(6.758057543099835e41),
    () => BigNum.valueOf(Number.MAX_VALUE).add(12345),
    () => BigNum.valueOf(Number.MIN_VALUE).subtract(12345),
  ]) {
    it(String(t), () => {
      let r = t();
      try {
        r = t();
      } catch (e) {
        chai.expect(e).toMatchSnapshot();
        return;
      }
      chai.expect(stringify(r)).toMatchSnapshot();
    });
  }
});

describe("Error tests", () => {
  for (const t of [() => BigNum.valueOf(2).sqrt({ roundingMode: 42 as any })]) {
    it(String(t), () => {
      let r;
      try {
        r = t();
      } catch (e) {
        chai.expect(e).toMatchSnapshot();
        return;
      }
      chai.expect(stringify(r)).toMatchSnapshot();
    });
  }
});
