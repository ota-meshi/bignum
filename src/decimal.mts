const RE_SIGN = /^[+-]/u;
const RE_NUMBERS = /\d*/uy;
const RE_INVALID_INTEGER = /^0\d/u;

/** Parse a value to a Decimal prop */
function parseValue(value: string | number | bigint | boolean) {
  if (typeof value === "bigint") {
    return { intValue: value, exponent: 0n };
  }
  if (typeof value === "boolean") {
    return { intValue: BigInt(value), exponent: 0n };
  }
  return parseString(String(value));
}

/** Parse a string to a Decimal prop */
function parseString(value: string) {
  const sign = RE_SIGN.exec(value)?.[0] || "";
  RE_NUMBERS.lastIndex = sign ? 1 : 0;
  const integer = RE_NUMBERS.exec(value)?.[0] || "";
  if (RE_INVALID_INTEGER.test(integer)) return null;
  const integerEndIndex = sign.length + integer.length;
  let decimal = "";
  if (value[integerEndIndex] === ".") {
    // Parse decimal part
    RE_NUMBERS.lastIndex = integerEndIndex + 1;
    decimal = RE_NUMBERS.exec(value)?.[0] || "";
  }
  if (!integer && !decimal) return null;
  const decimalEndIndex =
    integerEndIndex + (decimal ? 1 /* dot */ + decimal.length : 0);

  const intValue = BigInt(sign + integer + decimal);
  let exponent = -BigInt(decimal.length);
  if (decimalEndIndex < value.length) {
    // Parse exponent part
    if (value[decimalEndIndex]?.toLowerCase() !== "e") return null;
    try {
      exponent += BigInt(value.slice(decimalEndIndex + 1));
    } catch {
      return null;
    }
  }
  return { intValue, exponent };
}

class DecimalInternal {
  /** int value */
  private i: bigint;

  /** exponent */
  private e: bigint;

  /** denominator */
  private d: bigint;

  public constructor(intValue: bigint, exponent: bigint) {
    if (exponent > 0n) {
      this.i = intValue * 10n ** exponent;
      this.e = 0n;
      this.d = 1n;
    } else {
      this.i = intValue;
      this.e = exponent;
      this.d = 10n ** -exponent;
    }
  }

  public signum(): 1 | 0 | -1 {
    return this.i === 0n ? 0 : this.i > 0n ? 1 : -1;
  }

  public negate(): DecimalInternal {
    return new DecimalInternal(-this.i, this.e);
  }

  public abs(): DecimalInternal {
    if (this.i >= 0n) return this;
    return new DecimalInternal(-this.i, this.e);
  }

  public multiply(multiplicand: DecimalInternal): DecimalInternal {
    return new DecimalInternal(
      this.i * multiplicand.i,
      this.e + multiplicand.e,
    );
  }

  public divide(divisor: DecimalInternal, maxDp?: bigint): DecimalInternal {
    if (divisor.i === 0n) throw new Error("Division by zero");
    if (this.i === 0n) return this;
    const alignMultiplicand = new DecimalInternal(
      10n ** divisor.#decimalCount(),
      0n,
    );
    const alignedTarget: DecimalInternal =
      this.multiply(alignMultiplicand).#simplify();
    const alignedDivisor = divisor.multiply(alignMultiplicand).#simplify();

    let minQuotientExponent = alignedTarget.e > -20n ? -20n : alignedTarget.e;
    if (maxDp != null) {
      minQuotientExponent = maxDp;
    }
    if (alignedTarget.i % alignedDivisor.i === 0n) {
      const candidate = new DecimalInternal(
        alignedTarget.i / alignedDivisor.i,
        alignedTarget.e - alignedDivisor.e,
      );
      if (candidate.#decimalCount() <= -minQuotientExponent) return candidate;
    }

    const quotientSign =
      alignedTarget.signum() === alignedDivisor.signum() ? "" : "-";
    const absTarget = alignedTarget.abs();
    const absDivisor = alignedDivisor.abs().toBigInt();

    let remainder = absTarget.i;

    const quotientNumbers: bigint[] = [];
    let quotientExponent =
      absTarget.e + BigInt(String(absTarget.i).length) - 1n;
    let powOfTen = 10n ** quotientExponent;

    while (true) {
      // Find digit
      let n = 0n;
      let amount = 0n;
      for (let nn = 1n; nn < 10n; nn++) {
        const nextAmount = absDivisor * nn * powOfTen;
        if (remainder < nextAmount) break;
        n = nn;
        amount = nextAmount;
      }

      // Set digit
      if (
        // Ignore leading zero
        n ||
        quotientNumbers.length
      ) {
        quotientNumbers.push(n);
        remainder -= amount;
      }

      if (remainder === 0n || quotientExponent <= minQuotientExponent) break;

      // Setup for next process
      quotientExponent--;
      if (powOfTen > 1n) {
        powOfTen /= 10n;
      } else {
        remainder *= 10n;
      }
    }

    return new DecimalInternal(
      BigInt(quotientSign + (quotientNumbers.join("") || "0")),
      quotientExponent,
    );
  }

  public modulo(divisor: DecimalInternal): DecimalInternal {
    const times = this.divide(divisor, 0n);
    return this.subtract(divisor.multiply(times));
  }

  public pow(n: DecimalInternal | bigint): DecimalInternal {
    const bn = typeof n === "bigint" ? n : n.toBigInt();
    return new DecimalInternal(this.i ** bn, this.e * bn);
  }

  public add(augend: DecimalInternal): DecimalInternal {
    this.#alignExponent(augend);
    return new DecimalInternal(this.i + augend.i, this.e);
  }

  public subtract(subtrahend: DecimalInternal): DecimalInternal {
    this.#alignExponent(subtrahend);
    return new DecimalInternal(this.i - subtrahend.i, this.e);
  }

  public trunc() {
    if (this.i === 0n || this.e === 0n) return this;
    return new DecimalInternal(this.#truncInt(), 0n);
  }

  public round(): DecimalInternal {
    if (this.i === 0n || this.e === 0n) return this;
    const target = this.i % this.d;
    const h = 10n ** (-this.e - 1n) * 5n;
    if (this.i < 0n /* Minus */) {
      return target < -h ? this.floor() : this.ceil();
    }
    return target < h ? this.floor() : this.ceil();
  }

  public floor(): DecimalInternal {
    if (this.i === 0n || this.e === 0n) return this;
    if (this.i >= 0n) {
      // Plus
      return this.trunc();
    }
    const value = this.#truncInt() - 1n;
    return new DecimalInternal(value, 0n);
  }

  public ceil(): DecimalInternal {
    if (this.i === 0n || this.e === 0n) return this;
    if (this.i < 0n) {
      // Minus
      return this.trunc();
    }
    const value = this.#truncInt() + 1n;
    return new DecimalInternal(value, 0n);
  }

  public compareTo(other: DecimalInternal): 0 | -1 | 1 {
    this.#alignExponent(other);
    return compare(this.i, other.i);
  }

  public toString(): string {
    if (!this.e) return String(this.i);
    const integerPart = [...String(this.i)];
    const decimalPart: string[] = [];
    const sign = this.i < 0n ? integerPart.shift() : "";
    for (let n = this.e; n < 0; n++) {
      const decimal = integerPart.pop() || "0";
      if (decimalPart.length || decimal !== "0") decimalPart.unshift(decimal);
    }
    return `${sign}${integerPart.join("") || "0"}${decimalPart.length ? `.${decimalPart.join("")}` : ""}`;
  }

  public toBigInt(): bigint {
    if (!this.e) return this.i;
    if (this.#hasDecimalPart()) throw new Error("Decimal part exists");
    return this.#truncInt();
  }

  #decimalCount() {
    return -this.#simplify().e;
  }

  #simplify() {
    if (!this.e) return this;
    for (let e = -this.e; e > 0n; e--) {
      if (this.i % 10n ** e) {
        continue;
      }
      this.#updateExponent(this.e + e);
      break;
    }
    return this;
  }

  #truncInt() {
    if (!this.e) return this.i;
    return this.i / this.d;
  }

  #alignExponent(other: DecimalInternal) {
    if (this.e === other.e) return;
    if (this.e > other.e) {
      this.#updateExponent(other.e);
    } else {
      other.#updateExponent(this.e);
    }
  }

  #updateExponent(exponent: bigint) {
    if (this.e === exponent) return;
    const diff = this.e - exponent;
    if (diff > 0) this.i *= 10n ** diff;
    else this.i /= 10n ** -diff;
    this.e = exponent;
    this.d = 10n ** -exponent;
  }

  #hasDecimalPart() {
    return this.i % this.d > 0n;
  }
}
export class Decimal {
  static readonly #nan = new Decimal(NaN);

  readonly #p: DecimalInternal | null;

  public static valueOf(
    value: string | number | bigint | boolean | Decimal,
  ): Decimal {
    if (typeof value === "object" && value instanceof Decimal) {
      return value;
    }
    return new Decimal(value);
  }

  public constructor(
    value:
      | string
      | number
      | bigint
      | boolean
      | Decimal
      | DecimalInternal
      | null
      | undefined,
  ) {
    if (value == null) {
      this.#p = null;
      return;
    }
    if (value instanceof DecimalInternal) {
      this.#p = value;
      return;
    }
    if (value instanceof Decimal) {
      this.#p = value.#p;
      return;
    }
    const prop = parseValue(value);
    if (prop == null) {
      this.#p = null;
      return;
    }
    this.#p = new DecimalInternal(prop.intValue, prop.exponent);
  }

  /** Returns the signum function of this Decimal. */
  public signum(): -1 | 0 | 1 | typeof NaN {
    return this.#p?.signum() ?? NaN;
  }

  /** Returns a Decimal whose value is (-this). */
  public negate(): Decimal {
    return new Decimal(this.#p?.negate());
  }

  /** Returns a Decimal whose value is (this + augend) */
  public add(augend: Decimal): Decimal {
    const b = augend.#p;
    return b ? new Decimal(this.#p?.add(b)) : Decimal.#nan;
  }

  /** Returns a Decimal whose value is (this - subtrahend) */
  public subtract(subtrahend: Decimal): Decimal {
    const b = subtrahend.#p;
    return b ? new Decimal(this.#p?.subtract(b)) : Decimal.#nan;
  }

  /** Returns a Decimal whose value is (this × multiplicand). */
  public multiply(multiplicand: Decimal): Decimal {
    const b = multiplicand.#p;
    return b ? new Decimal(this.#p?.multiply(b)) : Decimal.#nan;
  }

  /**
   * Returns a Decimal whose value is (this / divisor)
   * @param options.maxDp The maximum number of decimal places. Default is 20.
   */
  public divide(divisor: Decimal, options?: { maxDp?: bigint }): Decimal {
    const b = divisor.#p;
    return b ? new Decimal(this.#p?.divide(b, options?.maxDp)) : Decimal.#nan;
  }

  /**
   * Returns a Decimal whose value is (this % divisor)
   */
  modulo(divisor: Decimal): Decimal {
    const b = divisor.#p;
    return b ? new Decimal(this.#p?.modulo(b)) : Decimal.#nan;
  }

  /** Returns a Decimal whose value is (this**n). */
  public pow(n: Decimal | bigint): Decimal {
    if (typeof n === "bigint") return new Decimal(this.#p?.pow(n));
    const b = n.#p;
    return b ? new Decimal(this.#p?.pow(n.#p)) : Decimal.#nan;
  }

  /** Returns a Decimal whose value is the absolute value of this Decimal. */
  public abs(): Decimal {
    return new Decimal(this.#p?.abs());
  }

  /** Returns a Decimal that is the integral part of this Decimal, with removing any fractional digits. */
  public trunc(): Decimal {
    return new Decimal(this.#p?.trunc());
  }

  /** Returns this Decimal rounded to the nearest integer. */
  public round(): Decimal {
    return new Decimal(this.#p?.round());
  }

  /** Returns the greatest integer less than or equal to this Decimal. */
  public floor(): Decimal {
    return new Decimal(this.#p?.floor());
  }

  /** Returns the smallest integer greater than or equal to this Decimal. */
  public ceil(): Decimal {
    return new Decimal(this.#p?.ceil());
  }

  /** Compares this Decimal with the specified Decimal. */
  public compareTo(other: Decimal): 0 | -1 | 1 | typeof NaN {
    const a = this.#p;
    const b = other.#p;
    if (!a || !b) return NaN;
    return a.compareTo(b);
  }

  public isNaN(): boolean {
    return !this.#p;
  }

  public toString(): string {
    return this.#p?.toString() ?? "NaN";
  }
}

/** compare function */
function compare(a: bigint, b: bigint) {
  return a === b ? 0 : a > b ? 1 : -1;
}
