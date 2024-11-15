import { gcd } from "./util.mjs";
import { divideDigits } from "./divide-digits.mts";

/**
 * Returns a Frac from the given decimal values
 */
export function numOf(i: bigint, e = 0n): Frac {
  return e >= 0n ? fracOf(i * 10n ** e, 1n) : fracOf(i, 10n ** -e);
}
/**
 * Returns a Frac from the given numerator and denominator
 */
export function fracOf(n: bigint, d: bigint): Frac {
  if (!n) {
    // zero
    return ZERO;
  }
  if (!d) {
    // infinity
    return n >= 0n ? INF : N_INF;
  }
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return new Frac(n / g, d / g);
}

/** Internal Fraction class */
export class Frac {
  /** numerator */
  public readonly n: bigint;

  /** denominator */
  public readonly d: bigint;

  /**
   * @deprecated Use `fracOf` instead.
   */
  constructor(n: bigint, g: bigint) {
    this.n = n;
    this.d = g;
  }

  public get inf(): boolean {
    return !this.d;
  }

  public toString(): string {
    if (this.inf) return this.n > 0 ? "Infinity" : "-Infinity";
    if (this.d === 1n) return String(this.n);
    const div = divideDigits(this.n, this.d);
    let e = div.e;
    let integer = "";
    let decimalLeadingZero = "0".repeat(Number(e < 0n ? -e - 1n : 0));
    let decimal = "";
    const isFull = finiteDecimal(this)
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
    return `${this.n < 0n ? "-" : ""}${integer || "0"}.${decimal}`;
  }
}
export const ZERO = new Frac(0n, 1n);
export const INF = new Frac(1n, 0n);
export const N_INF = new Frac(-1n, 0n);

/** Checks whether the x is a finite decimal. */
function finiteDecimal(x: Frac): boolean {
  let t = x.d;
  for (const n of [1000n, 10n, 5n, 2n]) {
    while (t >= n) {
      if (t % n) break;
      t /= n;
    }
  }
  return t === 1n;
}
