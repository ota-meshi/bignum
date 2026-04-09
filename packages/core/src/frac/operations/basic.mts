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
  return x.d === y.d
    ? ofNullable(x.n + y.n, x.d)
    : ofNullable(x.n * y.d + y.n * x.d, x.d * y.d);
}

/** Returns a Frac whose value is `x * y`. */
export function multiply(x: Frac, y: Frac): Frac | null {
  return mul(x.n, y.n, x.d, y.d);
}
/** Returns a Frac whose value is `x / y`. */
export function divide(x: Frac, y: Frac): Frac | null {
  return y.n >= 0n ? mul(x.n, y.d, x.d, y.n) : mul(x.n, -y.d, x.d, -y.n);
}

/** Returns a Frac whose value is `x % y`. */
export function modulo(x: Frac, y: Frac): Frac | null {
  return !x.d || !y.n
    ? null
    : !y.d
      ? x
      : fracOf((x.n * y.d) % (x.d * y.n), x.d * y.d);
}

/** Compare the two given `Frac`s. */
export function compareTo(x: Frac, y: Frac): 0 | -1 | 1 {
  return x.d === y.d
    ? compare(x.n, y.n)
    : !x.d || !y.d
      ? (!x.d ? x.n : -y.n) > 0
        ? 1
        : -1
      : compare(x.n * y.d, y.n * x.d);
}

/** Returns a Frac that is the integral part of x, with removing any fractional digits. */
function trunc0(x: Frac): Frac {
  return !x.d ? x : fracOf(x.n / x.d, 1n);
}

/** Returns a Frac that is the integral part of x, with removing any fractional digits. */
export function trunc(x: Frac, dp?: bigint): Frac {
  return atDecimalPlaces(x, dp, trunc0);
}

/** Returns this Frac rounded to the nearest integer. */
export function round(x: Frac, dp?: bigint): Frac {
  return atDecimalPlaces(x, dp, (v): Frac => {
    if (!v.d) return v;
    const dblMod = (absInt(v.n) % v.d) * 2n;
    if (!dblMod) return v;
    const minus = v.n < 0n;
    return (minus ? dblMod > v.d : dblMod >= v.d)
      ? fracOf(v.n / v.d + (minus ? -1n : 1n), 1n)
      : trunc0(v);
  });
}

/** Returns the largest integer less than or equal to x. */
export function floor(x: Frac, dp?: bigint): Frac {
  return atDecimalPlaces(
    x,
    dp,
    (v): Frac =>
      v.n >= 0n
        ? trunc0(v)
        : !v.d || !(v.n % v.d)
          ? v
          : fracOf(v.n / v.d - 1n, 1n),
  );
}

/** Returns the smallest integer greater than or equal to x. */
export function ceil(x: Frac, dp?: bigint): Frac {
  return atDecimalPlaces(
    x,
    dp,
    (v): Frac =>
      v.n <= 0n
        ? trunc0(v)
        : !v.d || !(v.n % v.d)
          ? v
          : fracOf(v.n / v.d + 1n, 1n),
  );
}

/** Multiply two fractions. */
function mul(n1: bigint, n2: bigint, d1: bigint, d2: bigint): Frac | null {
  // Avoid large integers by reducing the value by the greatest common divisor of each element.
  const gA = gcd(n1, d2);
  const gB = gcd(n2, d1);
  return !gA || !gB
    ? null /* NaN */
    : fracOf((n1 / gA) * (n2 / gB), (d1 / gB) * (d2 / gA));
}

/** Returns a Frac or null from the given numerator and denominator  */
function ofNullable(n: bigint, d: bigint): Frac | null {
  return !n && !d ? null /* NaN */ : fracOf(n, d);
}

/** Applies an integer rounding operation at the requested decimal place. */
function atDecimalPlaces(
  x: Frac,
  dp: bigint | undefined,
  op: (value: Frac) => Frac,
): Frac {
  if (!x.d || !dp) return op(x);
  const offset = fracOf(10n ** absInt(dp), 1n);
  const shift = dp > 0n ? multiply : divide;
  const unshift = dp > 0n ? divide : multiply;
  return unshift(op(shift(x, offset)!), offset)!;
}
