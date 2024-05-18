import { createNthRootTable } from "./nth-root-utils.mjs";
import {
  RoundingMode,
  type IsOverflow,
  type MathOptions,
  type OverflowContext,
} from "./options.mjs";
import { abs, compare, gcd, length, max } from "./util.mjs";

const NOT_SCALE_ZERO: IsOverflow = (ctx) => ctx.scale > 0n;

const ROUND_OPTS = Object.fromEntries(
  (
    Object.keys(RoundingMode).map(Number).filter(isFinite) as RoundingMode[]
  ).map((k) => [k, { overflow: NOT_SCALE_ZERO, roundingMode: k }]),
) as Record<RoundingMode, MathOptions>;
const DEF_OPT: IsOverflow = (ctx) => ctx.scale > 0n && ctx.precision > 20n;

/** Internal Fraction class */
export class Frac {
  /** numerator */
  private readonly n: bigint;

  /** denominator */
  private readonly d: bigint;

  public static numOf(i: bigint, e = 0n): Frac {
    return e >= 0n ? new Frac(i * 10n ** e, 1n) : new Frac(i, 10n ** -e);
  }

  public constructor(numerator: bigint, denominator: bigint) {
    let n = numerator,
      d = denominator;
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    if (d) {
      const g = gcd(n, d);
      this.n = n / g;
      this.d = d / g;
    } else {
      // infinity
      this.n = n >= 0n ? 1n : -1n;
      this.d = d;
    }
  }

  public signum(): 1 | 0 | -1 {
    return !this.n ? 0 : this.n > 0n ? 1 : -1;
  }

  public negate(): Frac {
    return new Frac(-this.n, this.d);
  }

  public abs(): Frac {
    if (this.n >= 0n) return this;
    return this.negate();
  }

  public get inf(): boolean {
    return !this.d;
  }

  public add(a: Frac): Frac | null {
    if (this.inf) return !a.inf || this.n === a.n ? this : null;
    if (a.inf) return a;
    const n = this.n * a.d + a.n * this.d;
    const d = this.d * a.d;
    return new Frac(n, d);
  }

  public multiply(m: Frac): Frac | null {
    if (this.inf)
      return !m.n
        ? null // inf * 0
        : this.n >= 0n === m.n >= 0n
          ? INF // match sign
          : N_INF;
    if (m.inf) return m.multiply(this);
    return new Frac(this.n * m.n, this.d * m.d);
  }

  public divide(d: Frac): Frac | null {
    if (this.inf)
      return d.inf
        ? null // inf / inf
        : this.n >= 0n === d.n >= 0n
          ? INF // match sign
          : N_INF;
    if (d.inf) return ZERO;
    if (!d.n) return this.n >= 0n ? INF : N_INF;
    if (!this.n) return this;
    return new Frac(this.n * d.d, this.d * d.n);
  }

  public modulo(d: Frac): Frac | null {
    if (this.inf) return null;
    if (d.inf) return this;
    if (!d.n) return null; // x % 0
    const times = this.divide(d)!.#setScale(ROUND_OPTS[RoundingMode.trunc]);
    return this.add(d.multiply(times)!.negate());
  }

  public pow(n: Frac, options?: MathOptions): Frac | null {
    if (this.inf) {
      if (n.inf)
        return n.n < 0n
          ? ZERO // inf ** -inf
          : INF; // inf ** inf
      if (!n.n) return ONE; // Inf ** 0
      if (n.n < 0n) return ZERO; // Inf ** -num
      if (this.n < 0n) {
        // minus
        const hasFrac = n.modulo(ONE)!.compareTo(ZERO);
        if (hasFrac) return INF;
        const binary = !n.modulo(Frac.numOf(2n))!.compareTo(ZERO);
        if (binary) return INF;
      }
      return this; // inf ** num
    }
    if (n.inf) {
      const minus = n.n < 0n;
      const cmpO = this.abs().compareTo(ONE);
      return cmpO < 0
        ? minus
          ? INF // 0 ** -inf, or 0.x ** -inf
          : ZERO // 0 ** inf, or 0.x ** inf
        : cmpO === 0
          ? null // 1 ** inf, or -1 ** inf
          : minus
            ? ZERO // num ** -inf
            : INF; // num ** inf;
    }
    return Frac.#pow(this, n.n, n.d, options);
  }

  public scaleByPowerOfTen(n: Frac): Frac | null {
    if (this.inf) return n.inf ? (n.n > 0 ? this : null) : this;
    if (n.inf)
      return n.n < 0n ? ZERO : !this.n ? null : this.n >= 0n ? INF : N_INF;
    return this.multiply(Frac.numOf(10n).pow(n)!);
  }

  public sqrt(options?: MathOptions): Frac | null {
    if (this.inf) return this.n < 0n ? null : INF;
    if (this.n < 0n)
      // Negative number
      return null;
    // See https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Decimal_(base_10)
    const [i, e] = this.#toNum();
    const decimalLength = -e;
    const decimalLengthIsOdd = decimalLength & 1n;

    let remainder = i;
    if (decimalLengthIsOdd) remainder *= 10n;
    let part = 0n;

    const digitExponent = BigInt(length(remainder)) / 2n + 1n;
    const pow: bigint = 100n ** digitExponent;

    const numCtx = numberContext(
      1,
      digitExponent - decimalLength / 2n - (decimalLengthIsOdd ? 1n : 0n),
      options,
    );
    while (remainder > 0n && !numCtx.overflow()) {
      numCtx.intVal *= 10n;
      numCtx.exponent--;
      remainder *= 100n;
      part *= 10n;
      // Find digit
      if (remainder < (part + 1n) * pow) continue; // Short circuit: If 1 is not available, it will not loop.
      for (let n = 9n; n > 0n; n--) {
        const amount = (part + n) * n * pow;
        if (remainder < amount) continue;
        // Set digit
        numCtx.intVal += n;
        remainder -= amount;
        part += n * 2n;
        break;
      }
    }
    numCtx.round(remainder);
    return Frac.numOf(...numCtx.toNum());
  }

  public nthRoot(n: Frac, options?: MathOptions): Frac | null {
    if (this.inf)
      return n.inf
        ? ONE
        : n.compareTo(ONE) === 0
          ? this
          : n.signum() < 0
            ? ZERO
            : INF;
    if (n.inf) return this.pow(ZERO);
    if (!n.abs().compareTo(ONE)) return this;
    if (!n.n) return this.pow(INF);
    if (this.n < 0n)
      // Negative number
      return null;
    return Frac.#pow(this, n.d, n.n, options);
  }

  public trunc(): Frac {
    return this.#setScale(ROUND_OPTS[RoundingMode.trunc]);
  }

  public round(): Frac {
    return this.#setScale(ROUND_OPTS[RoundingMode.round]);
  }

  public floor(): Frac {
    return this.#setScale(ROUND_OPTS[RoundingMode.floor]);
  }

  public ceil(): Frac {
    return this.#setScale(ROUND_OPTS[RoundingMode.ceil]);
  }

  public compareTo(other: Frac): 0 | -1 | 1 {
    if (this.inf)
      return other.inf && this.n > 0 === other.n > 0 ? 0 : this.n > 0 ? 1 : -1;
    if (other.inf) return other.n > 0 ? -1 : 1;
    const a = this.n * other.d;
    const b = other.n * this.d;
    return compare(a, b);
  }

  public toString(): string {
    if (this.inf) return this.n > 0 ? "Infinity" : "-Infinity";
    const [i, e] = this.#toNum();
    if (e >= 0n) {
      return String(i * 10n ** e);
    }
    const p = 10n ** -e;
    const integer = i / p;
    let decimal = abs(i) % p;
    let decimalLength = -Number(e);
    while (decimal && !(decimal % 10n)) {
      decimal /= 10n;
      decimalLength--;
    }
    return `${integer || `${i < 0n ? "-" : ""}${integer}`}${decimal ? `.${`${decimal}`.padStart(decimalLength, "0")}` : ""}`;
  }

  #setScale(options: MathOptions): Frac {
    if (this.inf) return this;
    return Frac.numOf(...this.#toNum(options));
  }

  /** Checks whether the this fraction is a finite decimal. */
  #finiteDecimal(): boolean {
    let t = this.d;
    for (const n of [1000n, 10n, 5n, 2n]) {
      while (t >= n) {
        if (t % n) break;
        t /= n;
      }
    }
    return t === 1n;
  }

  #toNum(options?: MathOptions): [bigint, bigint] {
    if (this.inf) throw new Error("Infinity");
    const { n, d } = this;
    if (!n) return [0n, 0n];
    if (!options) {
      options = this.#finiteDecimal()
        ? {
            overflow: () => false,
            roundingMode: RoundingMode.trunc,
          }
        : {
            roundingMode: RoundingMode.trunc,
          };
    }

    let remainder = abs(n);

    const digitExponent = max(BigInt(length(remainder) - length(d)) + 1n, 0n);
    const pow: bigint = 10n ** digitExponent;

    const numCtx = numberContext(n < 0n ? -1 : 1, digitExponent, options);
    while (remainder > 0n && !numCtx.overflow()) {
      numCtx.intVal *= 10n;
      numCtx.exponent--;
      remainder *= 10n;
      // Find digit
      if (remainder < d * pow) continue; // Short circuit: If 1 is not available, it will not loop.
      for (let nn = 9n; nn > 0n; nn--) {
        const amount = d * nn * pow;
        if (remainder < amount) continue;
        // Set digit
        numCtx.intVal += nn;
        remainder -= amount;
        break;
      }
    }
    numCtx.round(remainder);
    return numCtx.toNum();
  }

  /** pow() for fraction */
  static #pow(
    base: Frac,
    num: bigint,
    denom: bigint,
    options?: MathOptions,
  ): Frac | null {
    if (!num) return ONE; // x ** 0
    const sign = num >= 0n === denom >= 0n ? 1 : -1;
    if (!base.n) return sign < 0 ? INF : ZERO; // 0 ** x
    let n = abs(num);
    let d = abs(denom);
    const m = n / d;
    n %= d;
    let a = new Frac(base.n ** m, base.d ** m);
    if (n % d) {
      // has fraction
      if (base.n < 0n) return null;
      const g = gcd(n, d);
      n /= g;
      d /= g;

      a = a.multiply(Frac.#nthRoot(base, d, options)!.pow(Frac.numOf(n))!)!;
    }
    if (sign >= 0) return a;
    return ONE.divide(a);
  }

  static #nthRoot(base: Frac, n: bigint, options?: MathOptions): Frac | null {
    // See https://fermiumbay13.hatenablog.com/entry/2019/03/07/002938
    const iN = abs(n);
    const powOfTen = 10n ** iN;

    const [i, e] = base.#toNum();

    const decimalLength = -e;
    const mod = decimalLength % iN;

    let remainder = i;
    if (mod) remainder *= 10n ** (iN - mod);
    const table = createNthRootTable(iN);

    const digitExponent = BigInt(length(remainder)) / iN + 1n;
    const pow: bigint = powOfTen ** digitExponent;

    const numCtx = numberContext(
      1,
      digitExponent - decimalLength / iN - (mod ? 1n : 0n),
      options,
    );
    while (remainder > 0n && !numCtx.overflow()) {
      numCtx.intVal *= 10n;
      numCtx.exponent--;
      remainder *= powOfTen;
      table.prepare();
      // Find digit
      for (let nn = 9n; nn > 0n; nn--) {
        const amount = table.amount(nn) * pow;
        if (remainder < amount) continue;
        // Set digit
        numCtx.intVal += nn;
        remainder -= amount;
        table.set(numCtx.intVal);
        break;
      }
    }
    numCtx.round(remainder);
    const a = Frac.numOf(...numCtx.toNum());
    if (i >= 0n) return a;
    return ONE.divide(a);
  }
}
export const ZERO = Frac.numOf(0n);
export const ONE = Frac.numOf(1n);
export const INF = new Frac(1n, 0n);
export const N_INF = new Frac(-1n, 0n);

/**
 * Assert never.
 */
function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}

/**
 * Parse math options.
 */
function parseOptions(options: MathOptions | undefined): Required<MathOptions> {
  const { overflow, roundingMode } = options ?? {};
  return {
    overflow: overflow ?? DEF_OPT,
    roundingMode: roundingMode ?? RoundingMode.trunc,
  };
}

type NumberContext = {
  intVal: bigint;
  exponent: bigint;
  overflow: () => boolean;
  round(remainder: bigint): void;
  toNum(): [bigint, bigint];
};

/**
 * Create internal number context.
 */
function numberContext(
  sign: 1 | -1,
  initExponent: bigint,
  options: MathOptions | undefined,
): NumberContext {
  const { overflow, roundingMode: rm } = parseOptions(options);
  const ctx: NumberContext = {
    intVal: 0n,
    exponent: initExponent,
    overflow: () => overflow(overflowCtx),
    toNum() {
      const intVal = sign >= 0 ? this.intVal : -this.intVal;
      return this.exponent >= 0n
        ? [intVal * 10n ** this.exponent, 0n]
        : [intVal, this.exponent];
    },
    round(remainder: bigint) {
      const nextDigits = [];
      while (overflow(overflowCtx) && (ctx.intVal || !nextDigits.length)) {
        ctx.exponent++;
        nextDigits.push(ctx.intVal % 10n);
        ctx.intVal /= 10n;
      }
      if (rm === RoundingMode.trunc) return;
      if (!remainder && !nextDigits.some((r) => r)) return;
      if (rm === RoundingMode.round) {
        const last = nextDigits.pop()!;
        if (
          last >= 5n &&
          (sign > 0 || last > 5n || remainder || nextDigits.some((r) => r))
        )
          ctx.intVal++;
      } else if (rm === RoundingMode.floor) {
        if (sign < 0) ctx.intVal++;
      } else if (rm === RoundingMode.ceil) {
        if (sign > 0) ctx.intVal++;
      } else {
        assertNever(rm, "Unknown rounding mode");
      }
    },
  };
  const overflowCtx: OverflowContext = {
    get scale() {
      return -ctx.exponent;
    },
    get precision() {
      return BigInt(length(ctx.intVal));
    },
  };
  return ctx;
}
