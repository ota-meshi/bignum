import chai from "chai";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import { BigNum } from "../../src/index.mjs";
import { length } from "../../src/util.mts";

if (process.argv.includes("--update")) {
  chai.use(jestSnapshotPlugin());

  describe("performance tests", () => {
    for (const t of [
      () => BigNum.valueOf(100).pow(123.456),
      () => {
        // setup
        let a: BigNum;
        return [
          () => (a = BigNum.valueOf(20.56).pow(48.723)),
          () => a.toString(),
        ];
      },
      () => {
        // setup
        const n = 123456789n ** 1234n;
        return () => {
          for (let i = 0; i < 100; i++) {
            length(n);
          }
        };
      },
    ]) {
      const tests = [{ name: String(t), t, n: 1 }];
      while (tests.length) {
        const test = tests.shift()!;

        if (!String(test.t).includes("setup")) {
          it(test.name, () => {
            let time;
            try {
              const start = performance.now();
              test.t();
              const end = performance.now();
              time = end - start;
            } catch (e) {
              chai.expect(e).toMatchSnapshot();
              return;
            }
            chai.expect(time).toMatchSnapshot();
          });
          continue;
        }
        tests.unshift(
          ...([test.t()].flat() as (() => any)[]).map((child) => {
            return {
              name: `${test.name}->\n${"  ".repeat(test.n)}${String(child)
                .split("\n")
                .join(`\n${"  ".repeat(test.n)}`)}`,
              t: child,
              n: test.n + 1,
            };
          }),
        );
      }
    }
  });
}
