import chai from "chai";
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
    // subtract
    () => BigNum.valueOf(0.3).subtract(0.1),
    () => BigNum.valueOf(0.02).subtract(0.1),
    () => BigNum.valueOf(0.2).subtract(0.01),
    // signum
    () => BigNum.valueOf(0).signum(),
    () => BigNum.valueOf(1).signum(),
    () => BigNum.valueOf(-1).signum(),
    // negate
    () => BigNum.valueOf(0).negate(),
    () => BigNum.valueOf(1).negate(),
    () => BigNum.valueOf(-1).negate(),
    // abs
    () => BigNum.valueOf(0).abs(),
    () => BigNum.valueOf(1).abs(),
    () => BigNum.valueOf(-1).abs(),
    // divide
    () => BigNum.valueOf(1).divide(3),
    () => BigNum.valueOf(-1).divide(3),
    () => BigNum.valueOf(-1).divide(-3),
    () => BigNum.valueOf(200).divide(100).add(0.1),
    () => BigNum.valueOf(-0.001).divide(0.003),
    () => BigNum.valueOf(-0.001).divide(-0.003),
    // modulo
    () => BigNum.valueOf(1).modulo(3),
    () => BigNum.valueOf(3).modulo(3),
    () => BigNum.valueOf(10).modulo(3),
    () => BigNum.valueOf(-1).modulo(3),
    () => BigNum.valueOf(-3).modulo(3),
    () => BigNum.valueOf(-10).modulo(3),
    // pow
    () => BigNum.valueOf(2).pow(2),
    () => BigNum.valueOf(2).pow(3),
    () => BigNum.valueOf(2).pow(4),
    () => BigNum.valueOf(0.2).pow(2),
    () => BigNum.valueOf(0.2).pow(3),
    () => BigNum.valueOf(0.2).pow(4),
    () => BigNum.valueOf(0.2).pow(BigNum.valueOf(0.2).add(3.8)),
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
    // compareTo
    () => BigNum.valueOf(0.001).compareTo(0.001),
    () => BigNum.valueOf(0.001).compareTo(0.002),
    () => BigNum.valueOf(0.002).compareTo(0.001),
    // isNaN
    () => BigNum.valueOf(123.456).isNaN(),
    () => BigNum.valueOf(NaN).isNaN(),
  ]) {
    it(String(t), () => {
      chai.expect(JSON.stringify(t())).toMatchSnapshot();
    });
  }
});
