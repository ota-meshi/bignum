const RE_NUMBER = /^([+-]?(?:[1-9]\d*|0)?)(?:\.(\d+))?(?:e([+-]?\d+))?$/iu;

export type OverflowContext = {
  scale: bigint;
  precision: bigint;
};
export type IsOverflow = (
  context: OverflowContext,
) => boolean | undefined | null;
export type MathOptions = {
  /** You can specify an overflow test function. */
  overflow?: IsOverflow;
  /** @deprecated The maximum number of decimal places. */
  maxDp?: bigint;
  /** @deprecated The maximum number of precision when having decimals. */
  maxDecimalPrecision?: bigint;
};
export type DivideOptions = MathOptions;
export type SqrtOptions = MathOptions;
/** This is used in negative pows. */
export type PowOptions = MathOptions;

/** Parse a value to a BigNum prop */
function parseValue(
  value: string | number | bigint | boolean,
): { intValue: bigint; exponent?: bigint } | null {
  if (typeof value === "boolean" || typeof value === "bigint")
    return { intValue: BigInt(value) };
  if (typeof value === "number") {
    if (Number.isNaN(value)) return null;
    if (Number.isInteger(value)) return { intValue: BigInt(value) };
  }
  const match = RE_NUMBER.exec(String(value));
  if (!match) return null;
  const integer = match[1];
  const decimal = match[2] || "";
  const exponent = match[3] || "0";
  if ((!integer || integer === "+" || integer === "-") && !decimal)
    // Empty numbers. e.g. `+`, `-`, `.`, `+.` or `-.`.
    return null;

  return {
    intValue: BigInt(integer + decimal),
    exponent: -BigInt(decimal.length) + BigInt(exponent),
  };
}

const MOD_DIV_OPT: DivideOptions = { overflow: (ctx) => ctx.scale > 0n };

/**
 * Parse for overflow option.
 */
function parseOFOption(options: MathOptions = {}, currDp = 20n): IsOverflow {
  if (options.overflow) {
    return options.overflow;
  }
  const { maxDecimalPrecision, maxDp } = options;
  if (maxDecimalPrecision != null) {
    const checkPrecision: IsOverflow = (ctx) =>
      ctx.scale > 0n && ctx.precision > maxDecimalPrecision;
    if (maxDp == null) return checkPrecision;
    return (ctx) => ctx.scale > maxDp || checkPrecision(ctx);
  }
  if (maxDp != null) return (ctx) => ctx.scale > maxDp;
  const m = currDp < 20n ? 20n : currDp;
  return (ctx) => ctx.scale > m;
}

class Internal {
  public static readonly Z = new Internal(0n, 0n);

  public static readonly O = new Internal(1n, 0n);

  public readonly inf = false; // Is not infinity

  /** int value */
  public i: bigint;

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
    return !this.i ? 0 : this.i > 0n ? 1 : -1;
  }

  public negate(): Internal {
    return new Internal(-this.i, this.e);
  }

  public abs(): Internal {
    if (this.i >= 0n) return this;
    return this.negate();
  }

  public add(augend: Internal | Inf): Internal | Inf {
    if (augend.inf) return augend;
    this.#alignExponent(augend);
    return new Internal(this.i + augend.i, this.e);
  }

  public subtract(subtrahend: Internal | Inf): Internal | Inf {
    return this.add(subtrahend.negate());
  }

  public multiply(multiplicand: Internal): Internal;

  public multiply(multiplicand: Inf): Inf | null;

  public multiply(multiplicand: Internal | Inf): Internal | Inf | null;

  public multiply(multiplicand: Internal | Inf): Internal | Inf | null {
    if (multiplicand.inf) return multiplicand.multiply(this);
    return new Internal(this.i * multiplicand.i, this.e + multiplicand.e);
  }

  public divide(divisor: Internal, options?: DivideOptions): Internal;

  public divide(
    divisor: Internal | Inf,
    options?: DivideOptions,
  ): Internal | Inf;

  public divide(
    divisor: Internal | Inf,
    options?: DivideOptions,
  ): Internal | Inf {
    if (divisor.inf) return Internal.Z;
    if (!divisor.i) return this.d >= 0 ? Inf.P : Inf.N;
    if (!this.i) return this;
    const alignMultiplicand = new Internal(10n ** divisor.#scale(), 0n);
    const alignedTarget: Internal =
      this.multiply(alignMultiplicand).#simplify();
    const alignedDivisor = divisor.multiply(alignMultiplicand).#simplify();

    const overflow = parseOFOption(
      options,
      max(this.#scale(), divisor.#scale()),
    );

    if (!(alignedTarget.i % alignedDivisor.i)) {
      const candidate = new Internal(
        alignedTarget.i / alignedDivisor.i,
        alignedTarget.e - alignedDivisor.e,
      );
      if (
        !overflow({
          scale: candidate.#scale(),
          precision: BigInt(candidate.#precision()),
        })
      )
        return candidate;
    }

    const absTarget = alignedTarget.abs();
    const absDivisor = alignedDivisor.abs().#trunc();

    let remainder = absTarget.i;

    let digit = 0n;
    const digitExponent = length(remainder) - length(absDivisor) + 1n;
    let powOfTen: bigint;
    if (digitExponent >= 0n) {
      powOfTen = 10n ** digitExponent;
    } else {
      powOfTen = 1n;
      remainder *= 10n ** -digitExponent;
    }

    let exponent = digitExponent + absTarget.e;
    const overflowCtx: OverflowContext = {
      get scale() {
        return -exponent;
      },
      get precision() {
        return length(digit);
      },
    };
    while (remainder > 0n && !overflow(overflowCtx)) {
      exponent--;
      if (powOfTen > 1n) {
        powOfTen /= 10n;
      } else {
        remainder *= 10n;
      }

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
      digit = digit * 10n + n;
      remainder -= amount;
    }
    while (overflow(overflowCtx) && digit) {
      exponent++;
      digit /= 10n;
    }

    if (divisor.signum() !== this.signum()) digit = -digit;
    return new Internal(digit, exponent);
  }

  public modulo(divisor: Internal | Inf): Internal | Inf | null {
    if (divisor.inf) return this;
    if (!divisor.i) return null;
    const times = this.divide(divisor, MOD_DIV_OPT);
    return this.subtract(divisor.multiply(times));
  }

  public pow(n: Internal | Inf, options?: PowOptions): Internal | Inf | null {
    if (n.inf) {
      return !this.i
        ? n.s < 0
          ? Inf.P // 0 ** -inf
          : Internal.Z // 0 ** inf
        : this.abs().compareTo(Internal.O) === 0
          ? null // 1 ** inf, or -1 ** inf
          : n.s < 0
            ? Internal.Z // num ** -inf
            : Inf.P; // num ** inf;
    }
    const bn = n.toBigInt();
    if (bn >= 0n) return new Internal(this.i ** bn, this.e * bn);
    const divideOptions: DivideOptions = {
      overflow: (ctx) => ctx.scale > 0n && ctx.precision > 20n,
      ...options,
    };
    return Internal.O.divide(
      new Internal(this.i ** -bn, this.e * -bn),
      divideOptions,
    );
  }

  public scaleByPowerOfTen(n: Internal | Inf): Internal | Inf | null {
    if (n.inf)
      return n.s < 0
        ? Internal.Z
        : !this.i
          ? null
          : this.i >= 0n
            ? Inf.P
            : Inf.N;
    const bn = n.toBigInt();
    return new Internal(this.i, this.e + bn);
  }

  public sqrt(options?: SqrtOptions): Internal {
    if (!this.i) return this;
    if (this.i < 0n) throw new Error("Negative number");
    const overflow = parseOFOption(options, this.#scale());
    // See https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Decimal_(base_10)
    const decimalLength = this.#scale();
    const decimalLengthIsOdd = decimalLength & 1n;

    let remainder = this.#simplify().i;
    if (decimalLengthIsOdd) remainder *= 10n;
    let part = 0n;

    let digit = 0n;
    const digitExponent = length(remainder) / 2n + 1n;
    let powOfHand: bigint = 100n ** digitExponent;

    let exponent =
      digitExponent - decimalLength / 2n - (decimalLengthIsOdd ? 1n : 0n);
    const overflowCtx: OverflowContext = {
      get scale() {
        return -exponent;
      },
      get precision() {
        return length(digit);
      },
    };
    while (remainder > 0n && !overflow(overflowCtx)) {
      exponent--;
      if (powOfHand > 10n) {
        powOfHand /= 100n;
      } else {
        remainder *= 100n;
      }

      // Find digit
      let n = 0n;
      let amount = 0n;
      for (let nn = 1n; nn < 10n; nn++) {
        const nextAmount = nn * (part + nn) * powOfHand;
        if (remainder < nextAmount) break;
        n = nn;
        amount = nextAmount;
      }

      // Set digit
      digit = digit * 10n + n;
      remainder -= amount;
      part = (part + n * 2n) * 10n;
    }
    while (overflow(overflowCtx) && digit) {
      exponent++;
      digit /= 10n;
    }

    return new Internal(digit, exponent);
  }

  public trunc() {
    return !this.i || !this.e ? this : new Internal(this.#trunc(), 0n);
  }

  public round(): Internal {
    const mod = this.i % this.d;
    if (!mod) return this;
    const h = 10n ** (-this.e - 1n) * 5n;
    if (this.i < 0n /* Minus */) {
      return mod < -h ? this.floor(mod) : this.ceil(mod);
    }
    return mod < h ? this.floor(mod) : this.ceil(mod);
  }

  public floor(mod = this.i % this.d): Internal {
    if (!mod) return this;
    return this.i >= 0n
      ? this.trunc() // Plus
      : new Internal(this.#trunc() - 1n, 0n);
  }

  public ceil(mod = this.i % this.d): Internal {
    if (!mod) return this;
    return this.i < 0n
      ? this.trunc() // Minus
      : new Internal(this.#trunc() + 1n, 0n);
  }

  public compareTo(other: Internal | Inf): 0 | -1 | 1 {
    if (other.inf) return -other.compareTo(this) as 0 | -1 | 1;
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
    if (this.i % this.d) throw new Error("Decimal part exists");
    return this.#trunc();
  }

  #scale() {
    return -this.#simplify().e;
  }

  #precision() {
    let n = String(this.abs().i);
    while (n.endsWith("0")) n = n.slice(0, -1);
    return n.length || 1;
  }

  #simplify() {
    for (let e = -this.e; e > 0n; e--) {
      if (this.i % 10n ** e) {
        continue;
      }
      this.#updateExponent(this.e + e);
      break;
    }
    return this;
  }

  #trunc() {
    return !this.e ? this.i : this.i / this.d;
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
}

class Inf {
  public static readonly P = new Inf(1);

  public static readonly N = new Inf(-1);

  public readonly inf = true; // is infinity

  public readonly s: 1 | -1;

  private constructor(sign: 1 | -1) {
    this.s = sign;
  }

  public signum(): 1 | -1 {
    return this.s;
  }

  public negate(): Inf {
    return this.s === 1 ? Inf.N : Inf.P;
  }

  public add(augend: Inf | Internal): Inf | null {
    return !augend.inf || this === augend ? this : null;
  }

  public subtract(subtrahend: Inf | Internal): Inf | null {
    return this.add(subtrahend.negate());
  }

  public multiply(multiplicand: Inf | Internal): Inf | null {
    return !multiplicand.signum()
      ? null // inf * 0
      : multiplicand.signum() === this.s
        ? Inf.P // match sign
        : Inf.N;
  }

  public divide(divisor: Inf | Internal): Inf | null {
    return divisor.inf
      ? null // inf / inf
      : divisor.i >= 0n === this.s >= 0
        ? Inf.P // match sign
        : Inf.N;
  }

  public modulo(): null {
    return null;
  }

  public pow(n: Inf | Internal) {
    if (n.inf)
      return n.s < 0
        ? Internal.Z // inf ** -inf
        : Inf.P; // inf ** inf
    if (!n.i) return Internal.O; // Inf ** 0
    if (n.i < 0n) return Internal.Z;
    return this; // inf ** num
  }

  public sqrt(): Inf {
    return this;
  }

  public scaleByPowerOfTen(n: Inf | Internal) {
    return n.inf ? (n.s > 0 ? this : null) : this;
  }

  public compareTo(n: Inf | Internal) {
    return n.inf && this.s === n.s ? 0 : this.s > 0 ? 1 : -1;
  }

  public abs(): Inf {
    return Inf.P;
  }

  public trunc(): Inf {
    return this;
  }

  public round(): Inf {
    return this;
  }

  public ceil(): Inf {
    return this;
  }

  public floor(): Inf {
    return this;
  }

  public toString(): string {
    return String(this.toNum());
  }

  public toNum(): number {
    return this.s === 1 ? Infinity : -Infinity;
  }
}

export class BigNum {
  static readonly #nan = new BigNum(NaN);

  readonly #p: Internal | Inf | null;

  public static valueOf(
    value: string | number | bigint | boolean | BigNum,
  ): BigNum {
    return valueOf(value);
  }

  public constructor(
    value:
      | string
      | number
      | bigint
      | boolean
      | BigNum
      | Internal
      | Inf
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
    if (value instanceof Inf) {
      this.#p = value;
      return;
    }
    if (value === Infinity) {
      this.#p = Inf.P;
      return;
    }
    if (value === -Infinity) {
      this.#p = Inf.N;
      return;
    }
    const prop = parseValue(value);
    if (prop == null) {
      this.#p = null;
      return;
    }
    this.#p = new Internal(prop.intValue, prop.exponent ?? 0n);
  }

  /** Returns a number indicating the sign. */
  public signum(): -1 | 0 | 1 | typeof NaN {
    return this.#p?.signum() ?? NaN;
  }

  /** Returns a BigNum whose value is (-this). */
  public negate(): BigNum {
    return new BigNum(this.#p?.negate());
  }

  /** Returns a BigNum whose value is (this + augend) */
  public add(augend: BigNum | string | number | bigint): BigNum {
    const b = valueOf(augend).#p;
    return b ? new BigNum(this.#p?.add(b)) : BigNum.#nan;
  }

  /** Returns a BigNum whose value is (this - subtrahend) */
  public subtract(subtrahend: BigNum | string | number | bigint): BigNum {
    const b = valueOf(subtrahend).#p;
    return b ? new BigNum(this.#p?.subtract(b)) : BigNum.#nan;
  }

  /** Returns a BigNum whose value is (this × multiplicand). */
  public multiply(multiplicand: BigNum | string | number | bigint): BigNum {
    const b = valueOf(multiplicand).#p;
    return b ? new BigNum(this.#p?.multiply(b)) : BigNum.#nan;
  }

  /**
   * Returns a BigNum whose value is (this / divisor)
   */
  public divide(
    divisor: BigNum | string | number | bigint,
    options?: DivideOptions,
  ): BigNum {
    const b = valueOf(divisor).#p;
    return b ? new BigNum(this.#p?.divide(b, options)) : BigNum.#nan;
  }

  /**
   * Returns a BigNum whose value is (this % divisor)
   */
  public modulo(divisor: BigNum | string | number | bigint): BigNum {
    const b = valueOf(divisor).#p;
    return b ? new BigNum(this.#p?.modulo(b)) : BigNum.#nan;
  }

  /**
   * Returns a BigNum whose value is (this**n).
   */
  public pow(
    n: BigNum | string | number | bigint,
    options?: PowOptions,
  ): BigNum {
    const b = valueOf(n).#p;
    return b ? new BigNum(this.#p?.pow(b, options)) : BigNum.#nan;
  }

  /** Returns a BigNum whose numerical value is equal to (this * 10 ** n). */
  public scaleByPowerOfTen(n: BigNum | string | number | bigint): BigNum {
    const b = valueOf(n).#p;
    return b ? new BigNum(this.#p?.scaleByPowerOfTen(b)) : BigNum.#nan;
  }

  /** Returns an approximation to the square root of this. */
  public sqrt(options?: SqrtOptions): BigNum {
    return new BigNum(this.#p?.sqrt(options));
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
  public compareTo(
    other: BigNum | string | number | bigint,
  ): 0 | -1 | 1 | typeof NaN {
    const a = this.#p;
    const b = valueOf(other).#p;
    if (!a || !b) return NaN;
    return a.compareTo(b);
  }

  public isNaN(): boolean {
    return !this.#p;
  }

  public isFinite(): boolean {
    return this.#p != null && !this.#p.inf;
  }

  public toString(): string {
    return this.#p?.toString() ?? "NaN";
  }

  public toJSON(): string | number {
    if (!this.#p) return NaN;
    if (this.#p.inf) return this.#p.toNum();
    const str = this.toString();
    const num = Number(str);
    return String(num) === str ? num : str;
  }
}

/** Get a BigNum from the given value */
function valueOf(value: string | number | bigint | boolean | BigNum): BigNum {
  if (typeof value === "object" && value instanceof BigNum) {
    return value;
  }
  return new BigNum(value);
}

/** compare function */
function compare(a: bigint, b: bigint) {
  return a === b ? 0 : a > b ? 1 : -1;
}

/** Get length */
function length(a: bigint): bigint {
  let t = a;
  for (let i = 0n; ; i++) if (!(t /= 10n)) return i;
}

/** Get max value */
function max(a: bigint, b: bigint): bigint {
  return a >= b ? a : b;
}
