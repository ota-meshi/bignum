import { abs, length } from "./util.mts";

export type DivideDigits = {
  /** Initial exponent. */
  e: bigint;
  /** Iterate over each digit. */
  digits: (infinity?: boolean) => Iterable<bigint>;
};

/** Returns an instance that allows you to iterate through the digits of the result of division. */
export function divideDigits(n: bigint, d: bigint): DivideDigits {
  // if (!n) return ... // There is no need to consider it as it has already been processed.

  const e = BigInt(length(n) - length(d));
  let initRemainder = abs(n);
  let initRemainderPow = 1n;
  if (e >= 0n) initRemainderPow = 10n ** e;
  else initRemainder = initRemainder * 10n ** -e;

  const dd: DivideDigits = {
    e,
    *digits(infinity?: boolean) {
      let remainder = initRemainder;
      let pow = initRemainderPow;
      while (remainder > 0n) {
        // Find digit
        const amount = pow * d;
        let digit = 0n;
        while (remainder >= amount) {
          digit++;
          remainder -= amount;
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
