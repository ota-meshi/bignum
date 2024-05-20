import { RoundingMode, type MathOptions } from "../options.mts";
import { divideDigits } from "./divide-digits.mts";
import { Frac, ZERO } from "./frac.mts";
import { ROUND_OPTS, numberContext } from "./number-context.mts";
import { compare } from "./util.mts";

/**
 * Returns a number indicating the sign of the given Frac.
 */
export function signum(x: Frac): 1 | 0 | -1 {
  return !x.n ? 0 : x.n > 0n ? 1 : -1;
}

/** Returns a Frac with value `-x`. */
export function negate(x: Frac): Frac {
  return new Frac(-x.n, x.d);
}

/** Returns a Frac whose value is the absolute value of x. */
export function abs(x: Frac): Frac {
  if (x.n >= 0n) return x;
  return negate(x);
}

/** Returns a Frac whose value is `x + y`. */
export function add(x: Frac, y: Frac): Frac | null {
  return x.inf && y.inf && x.n !== y.n
    ? null
    : x.d === y.d
      ? new Frac(x.n + y.n, x.d)
      : new Frac(x.n * y.d + y.n * x.d, x.d * y.d);
}

/** Returns a Frac whose value is `x * y`. */
export function multiply(x: Frac, y: Frac): Frac | null {
  return (x.inf && !y.n) || (y.inf && !x.n)
    ? null
    : new Frac(x.n * y.n, x.d * y.d);
}
/** Returns a Frac whose value is `x / y`. */
export function divide(x: Frac, y: Frac): Frac | null {
  return x.inf && y.inf
    ? null
    : y.n >= 0n
      ? new Frac(x.n * y.d, x.d * y.n)
      : new Frac(x.n * -y.d, x.d * -y.n);
}
/** Returns a Frac whose value is `x % y`. */
export function modulo(x: Frac, y: Frac): Frac | null {
  return x.inf || !y.n
    ? null
    : y.inf
      ? x
      : add(
          x,
          negate(
            multiply(y, round(divide(x, y)!, ROUND_OPTS[RoundingMode.trunc]))!,
          ),
        );
}

/** Compare the two given `Frac`s. */
export function compareTo(x: Frac, y: Frac): 0 | -1 | 1 {
  return x.d === y.d
    ? compare(x.n, y.n)
    : x.inf
      ? x.n > 0
        ? 1
        : -1
      : y.inf
        ? y.n > 0
          ? -1
          : 1
        : compare(x.n * y.d, y.n * x.d);
}

/** Returns a Frac rounded using the specified options. */
export function round(x: Frac, options: MathOptions): Frac {
  if (x.inf) return x;
  const { n, d } = x;
  if (!n) return ZERO;
  if (d === 1n) return x;
  const div = divideDigits(n, d);
  const numCtx = numberContext(n < 0n ? -1 : 1, div.e, options);
  for (const digit of div.digits()) {
    numCtx.set(digit);
    if (numCtx.overflow()) break;
    numCtx.prepareNext();
  }
  numCtx.round(div.hasRemainder());
  return Frac.numOf(...numCtx.toNum());
}
