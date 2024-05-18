/** compare function */
export function compare(a: bigint, b: bigint): 0 | 1 | -1 {
  return a === b ? 0 : a > b ? 1 : -1;
}

/** Get length */
export function length(a: bigint): bigint {
  let t = a;
  for (let i = 1n; ; i++) if (!(t /= 10n)) return i;
}

/** Get max value */
export function max(a: bigint, b: bigint): bigint {
  return a >= b ? a : b;
}

/** Get abs value */
export function abs(a: bigint): bigint {
  return a >= 0n ? a : -a;
}

/** Find the greatest common divisor. */
export function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (true) {
    if (!b) return a;
    a %= b;
    if (!a) return b;
    b %= a;
  }
}
