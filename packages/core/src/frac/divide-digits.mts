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

  // `e` is the base-10 exponent of the first emitted digit.
  // Example: 123 / 4 = 30.75, so the first digit is in the 10^1 place and `e === 1`.
  const e = BigInt(length(n) - length(d));
  let initRemainder = abs(n);
  let initRemainderPow = 1n;
  // Align the remainder so the first division step can emit the most significant decimal digit.
  // When `e >= 0`, we compare against d * 10^e. Otherwise we scale the numerator instead.
  if (e >= 0n) initRemainderPow = 10n ** e;
  else initRemainder = initRemainder * 10n ** -e;

  const dd: DivideDigits = {
    e,
    *digits(infinity?: boolean) {
      let remainder = initRemainder;
      let pow = initRemainderPow;
      while (remainder > 0n) {
        // `amount` is the value represented by one unit of the current digit place.
        // Dividing the remainder by it yields the next base-10 digit directly.
        const amount = pow * d;
        const digit = remainder / amount;
        remainder %= amount;
        yield digit;
        // Move from 10^k to 10^(k-1). Once we are past the ones place, keep long division going
        // by shifting the remaining numerator one decimal place to the left.
        if (pow >= 10n) pow /= 10n;
        else remainder *= 10n;
      }
      // Some callers need an infinite stream so they can continue rounding after the exact digits end.
      // eslint-disable-next-line no-unmodified-loop-condition -- OK
      while (infinity) yield 0n;
    },
  };
  return dd;
}
