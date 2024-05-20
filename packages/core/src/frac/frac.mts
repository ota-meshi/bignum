import { gcd } from "./util.mjs";
import { divideDigits } from "./divide-digits.mts";

/**
 * Returns a Frac from the given decimal values
 */
export function numOf(i: bigint, e = 0n): Frac {
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
let init = false;
export const ZERO = numOf(0n);
export const INF = new Frac(1n, 0n);
export const N_INF = new Frac(-1n, 0n);
init = true;

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
