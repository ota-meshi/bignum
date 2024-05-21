import { Frac } from "../frac.mts";
import { compare, abs as absInt } from "../util.mts";

/**
 * Returns a number indicating the sign of the given Frac.
 */
export function signum(x: Frac): 1 | 0 | -1 {
  return compare(x.n, 0n);
}

/** Returns a Frac with value `-x`. */
export function negate(x: Frac): Frac {
  return new Frac(-x.n, x.d);
}

/** Returns a Frac whose value is the absolute value of x. */
export function abs(x: Frac): Frac {
  return x.n >= 0n ? x : negate(x);
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
      : add(x, negate(multiply(y, trunc(divide(x, y)!))!));
}

/** Compare the two given `Frac`s. */
export function compareTo(x: Frac, y: Frac): 0 | -1 | 1 {
  return x.d === y.d
    ? compare(x.n, y.n)
    : x.inf || y.inf
      ? (x.inf ? x.n : -y.n) > 0
        ? 1
        : -1
      : compare(x.n * y.d, y.n * x.d);
}

/** Returns a Frac that is the integral part of x, with removing any fractional digits. */
export function trunc(x: Frac): Frac {
  return x.inf ? x : new Frac(x.n / x.d, 1n);
}

/** Returns this Frac rounded to the nearest integer. */
export function round(x: Frac): Frac {
  if (x.inf) return x;
  const dblMod = (absInt(x.n) % x.d) * 2n;
  if (!dblMod) return x;
  const minus = x.n < 0n;
  return (minus ? dblMod > x.d : dblMod >= x.d)
    ? new Frac(x.n / x.d + (minus ? -1n : 1n), 1n)
    : trunc(x);
}

/** Returns the largest integer less than or equal to x. */
export function floor(x: Frac): Frac {
  return x.n >= 0n
    ? trunc(x)
    : x.inf || !(x.n % x.d)
      ? x
      : new Frac(x.n / x.d - 1n, 1n);
}

/** Returns the smallest integer greater than or equal to x. */
export function ceil(x: Frac): Frac {
  return x.n <= 0n
    ? trunc(x)
    : x.inf || !(x.n % x.d)
      ? x
      : new Frac(x.n / x.d + 1n, 1n);
}
