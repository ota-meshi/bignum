import { abs, length } from "./util.mts";

export type DivideDigits = {
  /** Initial exponent. */
  e: bigint;
  /** Iterate over each digit. */
  digits: (infinity?: boolean) => Iterable<bigint>;
  hasRemainder: () => boolean;
};

/** Returns an instance that allows you to iterate through the digits of the result of division. */
export function divideDigits(n: bigint, d: bigint): DivideDigits {
  // if (!n) return ... // There is no need to consider it as it has already been processed.

  const e = BigInt(length(n) - length(d));
  let initRemainder = abs(n);
  let initRemainderPow = 1n;
  if (e >= 0n) initRemainderPow = 10n ** e;
  else initRemainder = initRemainder * 10n ** -e;

  let remainder = initRemainder;
  const dd: DivideDigits = {
    e,
    hasRemainder: () => remainder > 0n,
    *digits(infinity?: boolean) {
      remainder = initRemainder;
      let pow = initRemainderPow;
      while (remainder > 0n) {
        // Find digit
        let digit = 0n;
        if (
          // Short circuit: If 1 is not available, it will not loop.
          remainder >=
          d * pow
        ) {
          for (let nn = 9n; nn > 0n; nn--) {
            const amount = d * nn * pow;
            if (remainder < amount) continue;
            // Set digit
            digit = nn;
            remainder -= amount;
            break;
          }
        }
        yield digit;
        if (pow >= 10n) pow /= 10n;
        else remainder *= 10n;
      }
      // eslint-disable-next-line no-unmodified-loop-condition -- OK
      while (infinity) yield 0n;
    },
  };
  return dd;
}
