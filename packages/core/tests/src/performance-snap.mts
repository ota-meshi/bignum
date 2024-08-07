import { BigNum } from "../../src/index.mjs";
import { length } from "../../src/frac/util.mjs";
import * as snap from "@ota-meshi/test-snapshot";

if (process.env.UPDATE_PREF) {
  describe("performance tests", () => {
    for (const t of [
      () => {
        // setup
        const a = BigNum.valueOf(20.56);
        return () => a.pow(48.723);
      },
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
          for (let i = 0; i < 1000; i++) {
            n.toString();
          }
        };
      },
      () => {
        // setup
        const n = BigNum.valueOf(1234n).divide(123456789n).divide(1000000n);
        return () => {
          for (let i = 0; i < 1000; i++) {
            n.toString();
          }
        };
      },
      () => {
        // setup
        const n = 123456789n ** 1234n;
        return () => {
          for (let i = 0; i < 1000; i++) {
            length(n);
          }
        };
      },
      () => {
        // setup
        const a = BigNum.valueOf(123456789.12345678);
        return [
          () => {
            for (let i = 0; i < 1000; i++) {
              a.sqrt();
            }
          },
          () => {
            for (let i = 0; i < 1000; i++) {
              a.nthRoot(2);
            }
          },
          () => {
            for (let i = 0; i < 1000; i++) {
              a.nthRoot(3);
            }
          },
        ];
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
              snap.expect(e).toMatchSnapshot();
              return;
            }
            snap.expect(`\nTime: ${time}\n`).toMatchSnapshot();
          });
          continue;
        }
        const setuped = test.t();
        const isList = Array.isArray(setuped);
        tests.unshift(
          ...([setuped].flat() as (() => any)[]).map((child, idx) => {
            return {
              name: `${test.name}\n${"  ".repeat(test.n)}->${isList ? `(${idx + 1})` : ""}\n${"  ".repeat(test.n)}${String(
                child,
              )
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
