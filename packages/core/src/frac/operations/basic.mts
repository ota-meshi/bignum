import type { Frac } from "../frac.mts";
import { fracOf } from "../frac.mts";
import { compare, abs as absInt, gcd } from "../util.mts";

/**
 * Returns a number indicating the sign of the given Frac.
 */
export function signum(x: Frac): 1 | 0 | -1 {
  return compare(x.n, 0n);
}

/** Returns a Frac with value `-x`. */
export function negate(x: Frac): Frac {
  return fracOf(-x.n, x.d);
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
      ? fracOf(x.n + y.n, x.d)
      : fracOf(x.n * y.d + y.n * x.d, x.d * y.d);
}

/** Returns a Frac whose value is `x * y`. */
export function multiply(x: Frac, y: Frac): Frac | null {
  return (x.inf && !y.n) || (y.inf && !x.n) ? null : mul(x.n, y.n, x.d, y.d);
}
/** Returns a Frac whose value is `x / y`. */
export function divide(x: Frac, y: Frac): Frac | null {
  return x.inf && y.inf
    ? null
    : y.n >= 0n
      ? mul(x.n, y.d, x.d, y.n)
      : mul(x.n, -y.d, x.d, -y.n);
}

/** Returns a Frac whose value is `x % y`. */
export function modulo(x: Frac, y: Frac): Frac | null {
  return x.inf || !y.n
    ? null
    : y.inf
      ? x
      : fracOf((x.n * y.d) % (x.d * y.n), x.d * y.d);
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
  return x.inf ? x : fracOf(x.n / x.d, 1n);
}

/** Returns this Frac rounded to the nearest integer. */
export function round(x: Frac): Frac {
  if (x.inf) return x;
  const dblMod = (absInt(x.n) % x.d) * 2n;
  if (!dblMod) return x;
  const minus = x.n < 0n;
  return (minus ? dblMod > x.d : dblMod >= x.d)
    ? fracOf(x.n / x.d + (minus ? -1n : 1n), 1n)
    : trunc(x);
}

/** Returns the largest integer less than or equal to x. */
export function floor(x: Frac): Frac {
  return x.n >= 0n
    ? trunc(x)
    : x.inf || !(x.n % x.d)
      ? x
      : fracOf(x.n / x.d - 1n, 1n);
}

/** Returns the smallest integer greater than or equal to x. */
export function ceil(x: Frac): Frac {
  return x.n <= 0n
    ? trunc(x)
    : x.inf || !(x.n % x.d)
      ? x
      : fracOf(x.n / x.d + 1n, 1n);
}

/** Multiply two fractions. */
function mul(n1: bigint, n2: bigint, d1: bigint, d2: bigint): Frac {
  // Avoid large integers by reducing the value by the greatest common divisor of each element.
  const gA = gcd(n1, d2);
  const gB = gcd(n2, d1);
  return fracOf((n1 / gA) * (n2 / gB), (d1 / gB) * (d2 / gA));
}
