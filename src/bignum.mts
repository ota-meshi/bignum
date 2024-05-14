const RE_SIGN = /^[+-]/u;
const RE_NUMBERS = /\d*/uy;
const RE_INVALID_INTEGER = /^0\d/u;

/** Parse a value to a BigNum prop */
function parseValue(value: string | number | bigint | boolean) {
  if (typeof value === "bigint") {
    return { intValue: value, exponent: 0n };
  }
  if (typeof value === "boolean") {
    return { intValue: BigInt(value), exponent: 0n };
  }
  return parseString(String(value));
}

/** Parse a string to a BigNum prop */
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

class Internal {
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

  public negate(): Internal {
    return new Internal(-this.i, this.e);
  }

  public abs(): Internal {
    if (this.i >= 0n) return this;
    return new Internal(-this.i, this.e);
  }

  public multiply(multiplicand: Internal): Internal {
    return new Internal(this.i * multiplicand.i, this.e + multiplicand.e);
  }

  public divide(divisor: Internal, maxDp?: bigint): Internal {
    if (divisor.i === 0n) throw new Error("Division by zero");
    if (this.i === 0n) return this;
    const alignMultiplicand = new Internal(10n ** divisor.#decimalCount(), 0n);
    const alignedTarget: Internal =
      this.multiply(alignMultiplicand).#simplify();
    const alignedDivisor = divisor.multiply(alignMultiplicand).#simplify();

    let minQuotientExponent = alignedTarget.e > -20n ? -20n : alignedTarget.e;
    if (maxDp != null) {
      minQuotientExponent = maxDp;
    }
    if (alignedTarget.i % alignedDivisor.i === 0n) {
      const candidate = new Internal(
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

    return new Internal(
      BigInt(quotientSign + (quotientNumbers.join("") || "0")),
      quotientExponent,
    );
  }

  public modulo(divisor: Internal): Internal {
    const times = this.divide(divisor, 0n);
    return this.subtract(divisor.multiply(times));
  }

  public pow(n: Internal | bigint): Internal {
    const bn = typeof n === "bigint" ? n : n.toBigInt();
    return new Internal(this.i ** bn, this.e * bn);
  }

  public add(augend: Internal): Internal {
    this.#alignExponent(augend);
    return new Internal(this.i + augend.i, this.e);
  }

  public subtract(subtrahend: Internal): Internal {
    this.#alignExponent(subtrahend);
    return new Internal(this.i - subtrahend.i, this.e);
  }

  public trunc() {
    if (this.i === 0n || this.e === 0n) return this;
    return new Internal(this.#truncInt(), 0n);
  }

  public round(): Internal {
    if (this.i === 0n || this.e === 0n) return this;
    const target = this.i % this.d;
    const h = 10n ** (-this.e - 1n) * 5n;
    if (this.i < 0n /* Minus */) {
      return target < -h ? this.floor() : this.ceil();
    }
    return target < h ? this.floor() : this.ceil();
  }

  public floor(): Internal {
    if (this.i === 0n || this.e === 0n) return this;
    if (this.i >= 0n) {
      // Plus
      return this.trunc();
    }
    const value = this.#truncInt() - 1n;
    return new Internal(value, 0n);
  }

  public ceil(): Internal {
    if (this.i === 0n || this.e === 0n) return this;
    if (this.i < 0n) {
      // Minus
      return this.trunc();
    }
    const value = this.#truncInt() + 1n;
    return new Internal(value, 0n);
  }

  public compareTo(other: Internal): 0 | -1 | 1 {
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

  #alignExponent(other: Internal) {
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
export class BigNum {
  static readonly #nan = new BigNum(NaN);

  readonly #p: Internal | null;

  public static valueOf(
    value: string | number | bigint | boolean | BigNum,
  ): BigNum {
    if (typeof value === "object" && value instanceof BigNum) {
      return value;
    }
    return new BigNum(value);
  }

  public constructor(
    value:
      | string
      | number
      | bigint
      | boolean
      | BigNum
      | Internal
      | null
      | undefined,
  ) {
    if (value == null) {
      this.#p = null;
      return;
    }
    if (value instanceof Internal) {
      this.#p = value;
      return;
    }
    if (value instanceof BigNum) {
      this.#p = value.#p;
      return;
    }
    const prop = parseValue(value);
    if (prop == null) {
      this.#p = null;
      return;
    }
    this.#p = new Internal(prop.intValue, prop.exponent);
  }

  /** Returns the signum function of this BigNum. */
  public signum(): -1 | 0 | 1 | typeof NaN {
    return this.#p?.signum() ?? NaN;
  }

  /** Returns a BigNum whose value is (-this). */
  public negate(): BigNum {
    return new BigNum(this.#p?.negate());
  }

  /** Returns a BigNum whose value is (this + augend) */
  public add(augend: BigNum): BigNum {
    const b = augend.#p;
    return b ? new BigNum(this.#p?.add(b)) : BigNum.#nan;
  }

  /** Returns a BigNum whose value is (this - subtrahend) */
  public subtract(subtrahend: BigNum): BigNum {
    const b = subtrahend.#p;
    return b ? new BigNum(this.#p?.subtract(b)) : BigNum.#nan;
  }

  /** Returns a BigNum whose value is (this × multiplicand). */
  public multiply(multiplicand: BigNum): BigNum {
    const b = multiplicand.#p;
    return b ? new BigNum(this.#p?.multiply(b)) : BigNum.#nan;
  }

  /**
   * Returns a BigNum whose value is (this / divisor)
   * @param options.maxDp The maximum number of decimal places. Default is 20.
   */
  public divide(divisor: BigNum, options?: { maxDp?: bigint }): BigNum {
    const b = divisor.#p;
    return b ? new BigNum(this.#p?.divide(b, options?.maxDp)) : BigNum.#nan;
  }

  /**
   * Returns a BigNum whose value is (this % divisor)
   */
  modulo(divisor: BigNum): BigNum {
    const b = divisor.#p;
    return b ? new BigNum(this.#p?.modulo(b)) : BigNum.#nan;
  }

  /** Returns a BigNum whose value is (this**n). */
  public pow(n: BigNum | bigint): BigNum {
    if (typeof n === "bigint") return new BigNum(this.#p?.pow(n));
    const b = n.#p;
    return b ? new BigNum(this.#p?.pow(n.#p)) : BigNum.#nan;
  }

  /** Returns a BigNum whose value is the absolute value of this BigNum. */
  public abs(): BigNum {
    return new BigNum(this.#p?.abs());
  }

  /** Returns a BigNum that is the integral part of this BigNum, with removing any fractional digits. */
  public trunc(): BigNum {
    return new BigNum(this.#p?.trunc());
  }

  /** Returns this BigNum rounded to the nearest integer. */
  public round(): BigNum {
    return new BigNum(this.#p?.round());
  }

  /** Returns the greatest integer less than or equal to this BigNum. */
  public floor(): BigNum {
    return new BigNum(this.#p?.floor());
  }

  /** Returns the smallest integer greater than or equal to this BigNum. */
  public ceil(): BigNum {
    return new BigNum(this.#p?.ceil());
  }

  /** Compares this BigNum with the specified BigNum. */
  public compareTo(other: BigNum): 0 | -1 | 1 | typeof NaN {
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
