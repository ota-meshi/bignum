import type { Inf } from "./inf.mjs";
import { INF, N_INF } from "./inf.mjs";
import { createNthRootTable } from "./nth-root-utils.mjs";
import type {
  DivideOptions,
  IsOverflow,
  MathOptions,
  NthRootOptions,
  OverflowContext,
  PowOptions,
  SqrtOptions,
} from "./options.mjs";

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

/** Get the DivideOptions for pow and sqrt  */
function getDivForPowOptions(options: MathOptions = {}): MathOptions {
  return {
    overflow: (ctx) => ctx.scale > 0n && ctx.precision > 20n,
    ...options,
  };
}

/** Internal Number class */
export class Num {
  public readonly inf = false; // Is not infinity

  /** int value */
  private i: bigint;

  /** exponent */
  private e: bigint;

  /** pow of ten denominator */
  private d: bigint;

  /** original fraction */
  private readonly frac?: [Num, Num];

  public constructor(intValue: bigint, exponent: bigint, frac?: [Num, Num]) {
    if (exponent > 0n) {
      this.i = intValue * 10n ** exponent;
      this.e = 0n;
      this.d = 1n;
    } else {
      this.i = intValue;
      this.e = exponent;
      this.d = 10n ** -exponent;
    }
    this.frac = frac;
  }

  public signum(): 1 | 0 | -1 {
    return !this.i ? 0 : this.i > 0n ? 1 : -1;
  }

  public negate(): Num {
    return new Num(-this.i, this.e);
  }

  public abs(): Num {
    if (this.i >= 0n) return this;
    return this.negate();
  }

  public add(augend: Num | Inf): Num | Inf {
    if (augend.inf) return augend;
    this.#alignExponent(augend);
    return new Num(this.i + augend.i, this.e);
  }

  public subtract(subtrahend: Num): Num;

  public subtract(subtrahend: Num | Inf): Num | Inf;

  public subtract(subtrahend: Num | Inf): Num | Inf {
    return this.add(subtrahend.negate());
  }

  public multiply(multiplicand: Num): Num;

  public multiply(multiplicand: Inf): Inf | null;

  public multiply(multiplicand: Num | Inf): Num | Inf | null;

  public multiply(multiplicand: Num | Inf): Num | Inf | null {
    if (multiplicand.inf) return multiplicand.multiply(this);
    const frac =
      multiplicand.frac?.map((n, i) => n.multiply(this.frac?.[i] ?? this)) ??
      this.frac?.map((n) => n.multiply(multiplicand));
    return new Num(
      this.i * multiplicand.i,
      this.e + multiplicand.e,
      frac as [Num, Num] | undefined,
    );
  }

  public divide(divisor: Num, options?: DivideOptions): Num;

  public divide(divisor: Num | Inf, options?: DivideOptions): Num | Inf;

  public divide(divisor: Num | Inf, options?: DivideOptions): Num | Inf {
    if (divisor.inf) return ZERO;
    if (!divisor.i) return this.d >= 0 ? INF : N_INF;
    if (!this.i) return this;
    if (divisor.frac) {
      const [num, denom] = divisor.frac;
      return this.multiply(denom).divide(num, options);
    }

    const alignMultiplicand = new Num(10n ** divisor.#scale(), 0n);
    const alignedTarget: Num = this.multiply(alignMultiplicand).#simplify();
    const alignedDivisor = divisor.multiply(alignMultiplicand).#simplify();

    const overflow = parseOFOption(
      options,
      max(this.#scale(), divisor.#scale()),
    );

    if (!(alignedTarget.i % alignedDivisor.i)) {
      // Short circuit
      const candidate = new Num(
        alignedTarget.i / alignedDivisor.i,
        alignedTarget.e - alignedDivisor.e,
      );
      if (
        !overflow({
          scale: candidate.#scale(),
          precision: candidate.#precision(),
        })
      )
        return candidate;
    }

    const iDivisor = abs(alignedDivisor.#trunc());

    let remainder = abs(alignedTarget.i);

    const digitExponent = max(length(remainder) - length(iDivisor) + 1n, 0n);
    const pow: bigint = 10n ** digitExponent;

    let digits = 0n;
    let exponent = digitExponent + alignedTarget.e;
    const overflowCtx: OverflowContext = {
      get scale() {
        return -exponent;
      },
      get precision() {
        return length(digits);
      },
    };
    while (remainder > 0n && !overflow(overflowCtx)) {
      exponent--;
      remainder *= 10n;
      digits *= 10n;
      // Find digit
      if (remainder < iDivisor * pow) continue; // Short circuit: If 1 is not available, it will not loop.
      for (let n = 9n; n > 0n; n--) {
        const amount = iDivisor * n * pow;
        if (remainder < amount) continue;
        // Set digit
        digits += n;
        remainder -= amount;
        break;
      }
    }
    while (overflow(overflowCtx) && digits) {
      exponent++;
      digits /= 10n;
    }

    if (divisor.signum() !== this.signum()) digits = -digits;
    return new Num(digits, exponent, [this, divisor]);
  }

  public modulo(divisor: Num | Inf): Num | Inf | null {
    if (divisor.inf) return this;
    if (!divisor.i) return null;
    const times = this.divide(divisor, MOD_DIV_OPT);
    return this.subtract(divisor.multiply(times));
  }

  public pow(n: Num, options?: PowOptions): Num | null;

  public pow(n: Num | Inf, options?: PowOptions): Num | Inf | null;

  public pow(n: Num | Inf, options?: PowOptions): Num | Inf | null {
    if (n.inf) {
      return !this.i
        ? n.signum() < 0
          ? INF // 0 ** -inf
          : ZERO // 0 ** inf
        : this.abs().compareTo(ONE) === 0
          ? null // 1 ** inf, or -1 ** inf
          : n.signum() < 0
            ? ZERO // num ** -inf
            : INF; // num ** inf;
    }
    if (n.frac) {
      const [num, denom] = n.frac;
      num.#alignExponent(denom);
      return this.#pow(num.i, denom.i, options);
    }
    return this.#pow(n.i, n.d, options);
  }

  public scaleByPowerOfTen(n: Num | Inf): Num | Inf | null {
    if (n.inf)
      return n.signum() < 0
        ? ZERO
        : !this.i
          ? null
          : this.i >= 0n
            ? INF
            : N_INF;
    if (!(n.i % n.d)) {
      const bn = n.#trunc();
      return new Num(this.i, this.e + bn);
    }
    return this.multiply(new Num(10n, 0n).pow(n)!);
  }

  public sqrt(options?: SqrtOptions): Num {
    if (!this.i) return this;
    if (this.i < 0n) throw new Error("Negative number");
    const overflow = parseOFOption(options, this.#scale());
    // See https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Decimal_(base_10)
    const decimalLength = this.#scale();
    const decimalLengthIsOdd = decimalLength & 1n;

    let remainder = this.#simplify().i;
    if (decimalLengthIsOdd) remainder *= 10n;
    let part = 0n;

    const digitExponent = length(remainder) / 2n + 1n;
    const pow: bigint = 100n ** digitExponent;

    let digits = 0n;
    let exponent =
      digitExponent - decimalLength / 2n - (decimalLengthIsOdd ? 1n : 0n);
    const overflowCtx: OverflowContext = {
      get scale() {
        return -exponent;
      },
      get precision() {
        return length(digits);
      },
    };
    while (remainder > 0n && !overflow(overflowCtx)) {
      exponent--;
      remainder *= 100n;
      digits *= 10n;
      part *= 10n;
      // Find digit
      if (remainder < (part + 1n) * pow) continue; // Short circuit: If 1 is not available, it will not loop.
      for (let n = 9n; n > 0n; n--) {
        const amount = (part + n) * n * pow;
        if (remainder < amount) continue;
        // Set digit
        digits += n;
        remainder -= amount;
        part += n * 2n;
        break;
      }
    }
    while (overflow(overflowCtx) && digits) {
      exponent++;
      digits /= 10n;
    }

    return new Num(digits, exponent);
  }

  public nthRoot(n: Num, options?: NthRootOptions): Num;

  public nthRoot(n: Num | Inf, options?: NthRootOptions): Num | Inf | null;

  public nthRoot(n: Num | Inf, options?: NthRootOptions): Num | Inf | null {
    if (n.inf) return this.pow(ZERO);
    if (n.abs().compareTo(ONE) === 0) return this.pow(n);
    if (!n.i) return this.pow(INF);
    if (!this.i) return this;
    if (this.i < 0n) throw new Error("Negative number");
    if (n.i % n.d) {
      // has fraction
      return this.#pow(n.d, n.i, options);
    }
    const overflow = parseOFOption(options, this.#scale());
    // See https://fermiumbay13.hatenablog.com/entry/2019/03/07/002938
    const iN = n.abs().#trunc();
    const powOfTen = 10n ** iN;

    const decimalLength = this.#scale();
    const mod = decimalLength % iN;

    let remainder = this.#simplify().i;
    if (mod) remainder *= 10n ** (iN - mod);
    const table = createNthRootTable(iN);

    const digitExponent = length(remainder) / iN + 1n;
    const pow: bigint = powOfTen ** digitExponent;

    let digits = 0n;
    let exponent = digitExponent - decimalLength / iN - (mod ? 1n : 0n);
    const overflowCtx: OverflowContext = {
      get scale() {
        return -exponent;
      },
      get precision() {
        return length(digits);
      },
    };
    while (remainder > 0n && !overflow(overflowCtx)) {
      exponent--;
      remainder *= powOfTen;
      digits *= 10n;
      table.prepare();
      // Find digit
      for (let nn = 9n; nn > 0n; nn--) {
        const amount = table.amount(nn) * pow;
        if (remainder < amount) continue;
        // Set digit
        digits += nn;
        remainder -= amount;
        table.set(digits);
        break;
      }
    }
    while (overflow(overflowCtx) && digits) {
      exponent++;
      digits /= 10n;
    }
    const a = new Num(digits, exponent);
    if (n.i >= 0n) return a;
    return ONE.divide(a, getDivForPowOptions(options));
  }

  public trunc(): Num {
    return !this.i || !this.e ? this : new Num(this.#trunc(), 0n);
  }

  public round(): Num {
    const mod = this.i % this.d;
    if (!mod) return this;
    const h = 10n ** (-this.e - 1n) * 5n;
    if (this.i < 0n /* Minus */) {
      return mod < -h ? this.floor(mod) : this.ceil(mod);
    }
    return mod < h ? this.floor(mod) : this.ceil(mod);
  }

  public floor(mod = this.i % this.d): Num {
    if (!mod) return this;
    return this.i >= 0n
      ? this.trunc() // Plus
      : new Num(this.#trunc() - 1n, 0n);
  }

  public ceil(mod = this.i % this.d): Num {
    if (!mod) return this;
    return this.i < 0n
      ? this.trunc() // Minus
      : new Num(this.#trunc() + 1n, 0n);
  }

  public compareTo(other: Num | Inf): 0 | -1 | 1 {
    if (other.inf) return other.signum() > 0 ? -1 : 1;
    this.#alignExponent(other);
    return compare(this.i, other.i);
  }

  public toString(): string {
    if (!this.e) return String(this.i);
    let integer = abs(this.i);
    const decimal: bigint[] = [];
    for (let n = this.e; n < 0; n++) {
      const last = integer % 10n;
      integer /= 10n;
      if (decimal.length || last) decimal.unshift(last);
    }
    const sign = this.i < 0n ? "-" : "";
    return `${sign}${integer}${decimal.length ? `.${decimal.join("")}` : ""}`;
  }

  /** pow() for fraction */
  #pow(
    numerator: bigint,
    denominator: bigint,
    options?: PowOptions,
  ): Num | null {
    const sign = numerator >= 0n === denominator >= 0n ? 1n : -1n;
    let n = abs(numerator);
    let d = abs(denominator);
    const m = n / d;
    n %= d;
    if (!m && !n) return ONE; // x ** 0
    if (!this.i) return this; // 0 ** x
    let a = new Num(this.i ** m, this.e * m); // this ** m
    if (n % d) {
      // has fraction
      if (this.i < 0n) return null;
      const g = gcd(n, d);
      n /= g;
      d /= g;
      a = a.multiply(
        this.nthRoot(new Num(d, 0n), getDivForPowOptions(options)).pow(
          new Num(n, 0n),
        )!,
      );
    }
    if (sign >= 0n) return a;
    return ONE.divide(a, getDivForPowOptions(options));
  }

  #scale() {
    return -this.#simplify().e;
  }

  #precision() {
    let n = this.i;
    while (!(n % 10n)) n /= 10n;
    return length(n);
  }

  #simplify() {
    if (!this.e) return this;
    const newE = this.e + length(this.i) - this.#precision();
    this.#updateExponent(min(newE, 0n));
    return this;
  }

  #trunc() {
    return !this.e ? this.i : this.i / this.d;
  }

  #alignExponent(other: Num) {
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
export const ZERO = new Num(0n, 0n);
export const ONE = new Num(1n, 0n);

/** compare function */
function compare(a: bigint, b: bigint) {
  return a === b ? 0 : a > b ? 1 : -1;
}

/** Get length */
function length(a: bigint): bigint {
  let t = a;
  for (let i = 1n; ; i++) if (!(t /= 10n)) return i;
}

/** Get max value */
function max(a: bigint, b: bigint): bigint {
  return a >= b ? a : b;
}

/** Get max value */
function min(a: bigint, b: bigint): bigint {
  return a <= b ? a : b;
}

/** Get abs value */
function abs(a: bigint): bigint {
  return a >= 0n ? a : -a;
}

/**
 * Find the greatest common divisor.
 */
function gcd(a: bigint, b: bigint): bigint {
  return b ? gcd(b, a % b) : a;
}
