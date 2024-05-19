import { createNthRootTable } from "./nth-root-utils.mjs";
import {
  RoundingMode,
  type IsOverflow,
  type MathOptions,
  type OverflowContext,
} from "./options.mjs";
import { abs, compare, gcd, isEven, length } from "./util.mjs";

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
    if (!n) {
      // zero
      this.n = 0n;
      this.d = 1n;
      return init ? ZERO : this;
    }
    if (!d) {
      // infinity
      this.n = n >= 0n ? 1n : -1n;
      this.d = d;
      return init ? (n >= 0n ? INF : N_INF) : this;
    }
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
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
    if (this.inf && a.inf && this.n !== a.n) return null;
    return this.d === a.d
      ? new Frac(this.n + a.n, this.d)
      : new Frac(this.n * a.d + a.n * this.d, this.d * a.d);
  }

  public multiply(m: Frac): Frac | null {
    if ((this.inf && !m.n) || (m.inf && !this.n)) return null;
    return new Frac(this.n * m.n, this.d * m.d);
  }

  public divide(d: Frac): Frac | null {
    if (this.inf && d.inf) return null;
    return d.n >= 0n
      ? new Frac(this.n * d.d, this.d * d.n)
      : new Frac(this.n * -d.d, this.d * -d.n);
  }

  public modulo(d: Frac): Frac | null {
    if (this.inf || !d.n) return null;
    if (d.inf) return this;
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
        const hasFrac = n.d > 1n;
        if (hasFrac) return INF; // Inf ** x.x
        if (isEven(n.n)) return INF; // Inf ** (2*int)
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
        : !cmpO
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
    return this.multiply(TEN.pow(n)!);
  }

  public sqrt(options?: MathOptions): Frac | null {
    if (this.inf) return this.n < 0n ? null : INF;
    if (!this.n) return ZERO;
    if (this.n < 0n)
      // Negative number
      return null;
    return Frac.#sqrt(this, options);
  }

  public nthRoot(n: Frac, options?: MathOptions): Frac | null {
    if (this.inf)
      return n.inf
        ? ONE
        : !n.compareTo(ONE)
          ? this
          : n.signum() < 0
            ? ZERO
            : INF;
    if (n.d === 1n && n.n === 2n) return this.sqrt(options);
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
    if (this.d === other.d) return compare(this.n, other.n);
    return compare(this.n * other.d, other.n * this.d);
  }

  public toString(): string {
    if (this.inf) return this.n > 0 ? "Infinity" : "-Infinity";
    if (this.d === 1n) return String(this.n);
    const div = divide(this.n, this.d);
    let e = div.e;
    let integer = "";
    let decimalLeadingZero = "0".repeat(Number(e < 0n ? -e - 1n : 0));
    let decimal = "";
    const isFull = this.#finiteDecimal()
      ? () => false
      : () =>
          decimal.length &&
          integer.length +
            (integer.length && decimalLeadingZero.length) +
            decimal.length >=
            20;
    for (const d of div.digits()) {
      if (e-- >= 0n) {
        if (integer || d) integer += d;
      } else if (decimal || d) decimal += d;
      else decimalLeadingZero += d;
      if (isFull()) break;
    }
    decimal = decimalLeadingZero + decimal;
    while (decimal.endsWith("0")) decimal = decimal.slice(0, -1);
    return `${this.n < 0n ? "-" : ""}${integer || "0"}${decimal ? `.${`${decimal}`}` : ""}`;
  }

  #setScale(options: MathOptions): Frac {
    if (this.inf) return this;
    const { n, d } = this;
    if (!n) return ZERO;
    if (d === 1n) return this;
    const div = divide(n, d);
    const numCtx = numberContext(n < 0n ? -1 : 1, div.e, options);
    for (const digit of div.digits()) {
      numCtx.set(digit);
      if (numCtx.overflow()) break;
      numCtx.prepareNext();
    }
    numCtx.round(div.hasRemainder());
    return Frac.numOf(...numCtx.toNum());
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
    const n = abs(num);
    const d = abs(denom);
    const i = n / d;
    const remN = n % d;
    let a: [bigint, bigint] = [base.n ** i, base.d ** i];
    if (remN) {
      // has fraction
      if (base.n < 0n) return null;
      const nthRoot = Frac.#nthRoot(base, d, options);
      a = [a[0] * nthRoot.n ** remN, a[1] * nthRoot.d ** remN];
    }
    if (sign >= 0) return new Frac(a[0], a[1]);
    return new Frac(a[1], a[0]);
  }

  static #sqrt(base: Frac, options?: MathOptions): Frac | null {
    // See https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Decimal_(base_10)
    const div = divide(base.n, base.d);

    const numCtx = numberContext(
      1,
      div.e / 2n + (div.e >= 0n || isEven(div.e) ? 0n : -1n),
      options,
    );

    let remainder = 0n;
    let part = 0n;
    const bf: bigint[] = [];
    if (isEven(div.e)) bf.push(0n);

    for (const digit of div.digits(true)) {
      if (bf.push(digit) < 2) continue;
      remainder =
        remainder * 100n + (bf.shift() ?? 0n) * 10n + (bf.shift() ?? 0n);
      part *= 10n;
      // Find digit
      if (
        // Short circuit: If 1 is not available, it will not loop.
        remainder >=
        part + 1n
      ) {
        for (let nn = 9n; nn > 0n; nn--) {
          const amount = (part + nn) * nn;
          if (remainder < amount) continue;
          // Set digit
          numCtx.set(nn);
          remainder -= amount;
          part += nn * 2n;
          break;
        }
      }
      if (numCtx.overflow()) break;
      numCtx.prepareNext();
    }
    numCtx.round(remainder > 0n);
    return Frac.numOf(...numCtx.toNum());
  }

  static #nthRoot(base: Frac, n: bigint, options?: MathOptions): Frac {
    // See https://fermiumbay13.hatenablog.com/entry/2019/03/07/002938
    const iN = abs(n);

    const div = divide(base.n, base.d);

    const numCtx = numberContext(
      1,
      div.e / iN + (div.e >= 0n || !(div.e % iN) ? 0n : -1n),
      options,
    );

    let remainder = 0n;
    const powOfTen = 10n ** iN;
    const table = createNthRootTable(iN);
    const bf: bigint[] = [];
    const initBfLen =
      div.e >= 0n ? iN - ((abs(div.e) % iN) + 1n) : abs(div.e + 1n) % iN;
    while (bf.length < initBfLen) bf.push(0n);

    for (const digit of div.digits(true)) {
      if (bf.push(digit) < iN) continue;
      remainder *= powOfTen;
      let bfPow = powOfTen;
      while (bf.length) remainder += bf.shift()! * (bfPow /= 10n);
      table.prepare();
      // Find digit
      for (let nn = 9n; nn > 0n; nn--) {
        const amount = table.amount(nn);
        if (remainder < amount) continue;
        // Set digit
        numCtx.set(nn);
        remainder -= amount;
        table.set(numCtx.getInt());
        break;
      }
      if (numCtx.overflow()) break;
      numCtx.prepareNext();
    }
    numCtx.round(remainder > 0n);
    const a = Frac.numOf(...numCtx.toNum());
    if (n >= 0n) return a;
    return new Frac(a.d, a.n);
  }
}
let init = false;
const ZERO = Frac.numOf(0n);
const ONE = Frac.numOf(1n);
const TEN = Frac.numOf(10n);
export const INF = new Frac(1n, 0n);
export const N_INF = new Frac(-1n, 0n);
init = true;

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
  /** Set the currently digit. */
  set(n: bigint): void;
  /** Prepare for the next digit. */
  prepareNext(): void;
  getInt(): bigint;
  overflow: () => boolean;
  round(hasRemainder: boolean): void;
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
  let intVal = 0n,
    exponent = initExponent,
    precision = 1n;
  const ctx: NumberContext = {
    set(n: bigint) {
      intVal += n;
    },
    prepareNext() {
      intVal *= 10n;
      exponent--;
      if (intVal) precision++;
    },
    getInt() {
      return intVal;
    },
    overflow: () => overflow(overflowCtx),
    toNum() {
      const signed = sign >= 0 ? intVal : -intVal;
      return exponent >= 0n
        ? [signed * 10n ** exponent, 0n]
        : [signed, exponent];
    },
    round(hasRem: boolean) {
      const nextDigits = [];
      while (overflow(overflowCtx)) {
        exponent++;
        nextDigits.push(intVal % 10n);
        intVal /= 10n;
        precision--;
      }
      if (rm === RoundingMode.trunc) return;
      if (!hasRem && !nextDigits.some((r) => r)) return;
      if (rm === RoundingMode.round) {
        const last = nextDigits.pop() ?? 0n;
        if (
          last >= 5n &&
          (sign > 0 || last > 5n || hasRem || nextDigits.some((r) => r))
        )
          intVal++;
      } else if (rm === RoundingMode.floor) {
        if (sign < 0) intVal++;
      } else if (rm === RoundingMode.ceil) {
        if (sign > 0) intVal++;
      } else {
        assertNever(rm, "Unknown rounding mode");
      }
    },
  };
  const overflowCtx: OverflowContext = {
    get scale() {
      return -exponent;
    },
    get precision() {
      return precision;
    },
  };
  return ctx;
}

/** Returns an instance that allows you to iterate through the digits of the result of division. */
function divide(
  n: bigint,
  d: bigint,
): {
  e: bigint; // Initial exponent.
  digits: (infinity?: boolean) => Iterable<bigint>; // Iterate over each digit.
  hasRemainder: () => boolean;
} {
  if (!n)
    return {
      e: 0n,
      *digits() {
        yield 0n;
      },
      hasRemainder: () => false,
    };

  const e = BigInt(length(n) - length(d));
  let initRemainder = abs(n);
  let initRemainderPow = 1n;
  if (e >= 0n) initRemainderPow = 10n ** e;
  else initRemainder = initRemainder * 10n ** -e;

  let remainder = initRemainder;
  const ctx = {
    e,
    hasRemainder: () => remainder > 0n,
    *digits(infinity?: boolean) {
      remainder = initRemainder;
      let pow = initRemainderPow;
      while (remainder > 0n) {
        // Find digit
        let digit = 0n;
        if (
          // Short circuit: If 1 is not available, it will not loop.
          remainder >=
          d * pow
        ) {
          for (let nn = 9n; nn > 0n; nn--) {
            const amount = d * nn * pow;
            if (remainder < amount) continue;
            // Set digit
            digit = nn;
            remainder -= amount;
            break;
          }
        }
        yield digit;
        if (pow >= 10n) pow /= 10n;
        else remainder *= 10n;
      }
      // eslint-disable-next-line no-unmodified-loop-condition -- OK
      while (infinity) yield 0n;
    },
  };
  return ctx;
}
