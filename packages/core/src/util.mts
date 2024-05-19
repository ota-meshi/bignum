/** compare function */
export function compare(a: bigint, b: bigint): 0 | 1 | -1 {
  return a === b ? 0 : a > b ? 1 : -1;
}

/** Get length */
export function length(a: bigint): number {
  return String(abs(a)).length;
}

/** Get max value */
export function max(a: bigint, b: bigint): bigint {
  return a >= b ? a : b;
}

/** Get abs value */
export function abs(a: bigint): bigint {
  return a >= 0n ? a : -a;
}

/** Checks whether the given value is an even */
export function isEven(a: bigint): boolean {
  return !(a & 1n);
}

/** Find the greatest common divisor. */
export function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b) {
    a %= b;
    if (!a) return b;
    b %= a;
  }
  return a;
}
