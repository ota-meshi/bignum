const RE_NUMBER = /^([+-]?(?:[1-9]\d*|0)?)(?:\.(\d+))?(?:e([+-]?\d+))?$/iu;

/** Get a Frac from the given value */
export function valueOf(
  value: string | number | bigint | boolean | Frac,
): Frac {
  if (value instanceof Frac) return value;
  return parsePrimValue(value);
}

/** Parse a primitive value to a BigNum prop */
function parsePrimValue(value: string | number | bigint | boolean): Frac {
  if (typeof value === "boolean" || typeof value === "bigint")
    return new Frac(BigInt(value), 1n);
  if (typeof value === "number") {
    if (Number.isNaN(value)) throw new Error(`Invalid value: ${value}`);
    if (Number.isSafeInteger(value)) return new Frac(BigInt(value), 1n);
  }
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

  return e >= 0n ? new Frac(i * 10n ** e, 1n) : new Frac(i, 10n ** -e);
}

/** Internal Fraction class */
export class Frac {
  /** numerator */
  public readonly n: bigint;

  /** denominator */
  public readonly d: bigint;

  public constructor(numerator: bigint, denominator: bigint) {
    let n = numerator,
      d = denominator;
    if (!n) {
      // zero
      this.n = 0n;
      this.d = 1n;
      return;
    }
    if (!d) {
      // infinity
      this.n = n >= 0n ? 1n : -1n;
      this.d = d;
      return;
    }
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }

  public get inf(): boolean {
    return !this.d;
  }

  public add(x: Frac): Frac {
    return new Frac(this.n * x.d + x.n * this.d, this.d * x.d);
  }

  public sub(x: Frac): Frac {
    return new Frac(this.n * x.d - x.n * this.d, this.d * x.d);
  }

  public mul(x: Frac): Frac {
    return new Frac(this.n * x.n, this.d * x.d);
  }

  public div(x: Frac): Frac {
    return new Frac(this.n * x.d, this.d * x.n);
  }

  public mod(x: Frac): Frac {
    return new Frac((this.n * x.d) % (this.d * x.n), this.d * x.d);
  }
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
