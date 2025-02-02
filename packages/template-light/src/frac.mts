const RE_NUMBER = /^([+-]?(?:[1-9]\d*|0)?)(?:\.(\d+))?(?:e([+-]?\d+))?$/iu;

/** Get a Frac from the given value */
export function valueOf(value: string | number | bigint | boolean): Frac {
  if (typeof value === "object") return value;
  if (Number.isNaN(value)) throw new Error(`Invalid value: ${value}`);
  if (
    typeof value === "boolean" ||
    typeof value === "bigint" ||
    Number.isSafeInteger(value)
  )
    return fracOf(BigInt(value), 1n);
  return parsePrimValue(value);
}

/** Parse a primitive value to a BigNum prop */
function parsePrimValue(value: string | number): Frac {
  const match = RE_NUMBER.exec(String(value));
  if (!match) throw new Error(`Invalid value: ${value}`);
  const integer = match[1];
  const decimal = match[2] || "";
  const exponent = match[3] || "0";
  if ((!integer || integer === "+" || integer === "-") && !decimal)
    // Empty numbers. e.g. `+`, `-`, `.`, `+.` or `-.`.
    throw new Error(`Invalid value: ${value}`);
  const i = BigInt(integer + decimal);
  const e = -BigInt(decimal.length) + BigInt(exponent);

  return e >= 0n ? fracOf(i * 10n ** e, 1n) : fracOf(i, 10n ** -e);
}

/**
 * Returns a Frac from the given numerator and denominator
 */
function fracOf(n: bigint, d: bigint): Frac {
  if (!n) {
    // zero
    return { n: 0n, d: 1n };
  }
  if (!d) {
    // infinity
    return { n: n >= 0n ? 1n : -1n, d: 0n };
  }
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

/** Internal Fraction type */
export type Frac = {
  /** numerator */
  n: bigint;

  /** denominator */
  d: bigint;
};

/**
 * Add two Frac
 */
export function add(a: Frac, b: Frac): Frac {
  return fracOf(a.n * b.d + b.n * a.d, a.d * b.d);
}

/**
 * Subtract two Frac
 */
export function sub(a: Frac, b: Frac): Frac {
  return fracOf(a.n * b.d - b.n * a.d, a.d * b.d);
}

/**
 * Multiply two Frac
 */
export function mul(a: Frac, b: Frac): Frac {
  return fracOf(a.n * b.n, a.d * b.d);
}

/**
 * Divide two Frac
 */
export function div(a: Frac, b: Frac): Frac {
  return fracOf(a.n * b.d, a.d * b.n);
}

/**
 * Modulo two Frac
 */
export function mod(a: Frac, b: Frac): Frac {
  return fracOf((a.n * b.d) % (a.d * b.n), a.d * b.d);
}

/** Get abs value */
function abs(a: bigint): bigint {
  return a >= 0n ? a : -a;
}

/** Find the greatest common divisor. */
function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b) {
    a %= b;
    if (!a) return b;
    b %= a;
  }
  return a;
}
