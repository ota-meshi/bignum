import { Num, ONE, ZERO } from "./num.mjs";

/** Internal Infinity class */
export class Inf {
  public readonly inf = true; // is infinity

  private readonly s: 1 | -1;

  public constructor(sign: 1 | -1) {
    this.s = sign;
  }

  public signum(): 1 | -1 {
    return this.s;
  }

  public negate(): Inf {
    return this.s === 1 ? N_INF : INF;
  }

  public add(augend: Inf | Num): Inf | null {
    return !augend.inf || this === augend ? this : null;
  }

  public subtract(subtrahend: Inf | Num): Inf | null {
    return this.add(subtrahend.negate());
  }

  public multiply(multiplicand: Inf | Num): Inf | null {
    return !multiplicand.signum()
      ? null // inf * 0
      : multiplicand.signum() === this.s
        ? INF // match sign
        : N_INF;
  }

  public divide(divisor: Inf | Num): Inf | null {
    return divisor.inf
      ? null // inf / inf
      : divisor.signum() >= 0n === this.s >= 0
        ? INF // match sign
        : N_INF;
  }

  public modulo(): null {
    return null;
  }

  public pow(n: Inf | Num): Inf | Num {
    if (n.inf)
      return n.s < 0
        ? ZERO // inf ** -inf
        : INF; // inf ** inf
    if (!n.signum()) return ONE; // Inf ** 0
    if (n.signum() < 0n) return ZERO; // Inf ** -num
    if (this.s < 0) {
      // minus
      const hasFrac = n.modulo(ONE)!.compareTo(ZERO);
      if (hasFrac) return INF;
      const binary = !n.modulo(new Num(2n, 0n))!.compareTo(ZERO);
      if (binary) return INF;
    }
    return this; // inf ** num
  }

  public sqrt(): Inf | null {
    return this.s < 0 ? null : INF;
  }

  public nthRoot(n: Inf | Num): Inf | Num | null {
    return n.inf
      ? ONE
      : n.compareTo(ONE) === 0
        ? this
        : n.signum() < 0
          ? ZERO
          : INF;
  }

  public scaleByPowerOfTen(n: Inf | Num): Inf | null {
    return n.inf ? (n.s > 0 ? this : null) : this;
  }

  public compareTo(n: Inf | Num): 1 | 0 | -1 {
    return n.inf && this.s === n.s ? 0 : this.s > 0 ? 1 : -1;
  }

  public abs(): Inf {
    return INF;
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
export const INF = new Inf(1);

export const N_INF = new Inf(-1);
