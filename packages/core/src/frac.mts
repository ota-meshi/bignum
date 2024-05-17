import type { Inf } from "./inf.mjs";
import { Num } from "./num.mjs";
import type { IsOverflow } from "./options.mjs";

/** Internal Fraction class */
export class Frac {
  /** numerator */
  public readonly n: Num;

  /** denominator */
  public readonly d: Num;

  public readonly opt: IsOverflow;

  public static valueOf(n: Num, d: Num, overflowOpt: IsOverflow): Frac {
    if (n.frac) Frac.valueOf(n.frac.n, d.multiply(n.frac.d), overflowOpt);
    if (d.frac) Frac.valueOf(n.multiply(d.frac.d), d.frac.n, overflowOpt);
    return new Frac(n, d, overflowOpt);
  }

  private constructor(n: Num, d: Num, opt: IsOverflow) {
    this.n = n;
    this.d = d;
    this.opt = opt;
  }

  public static add(a: Num, b: Num): Frac | null {
    return a.frac
      ? Frac.valueOf(a.frac.n.add(b.multiply(a.frac.d)), a.frac.d, a.frac.opt)
      : b.frac
        ? Frac.add(b, a)
        : null;
  }

  public static mul(a: Num, b: Num): Frac | null {
    return a.frac
      ? Frac.valueOf(a.frac.n.multiply(b), a.frac.d, a.frac.opt)
      : b.frac
        ? Frac.mul(b, a)
        : null;
  }

  public static div(n: Num, d: Num): Frac | null {
    return n.frac
      ? Frac.valueOf(n.frac.n, d.multiply(n.frac.d), n.frac.opt)
      : d.frac
        ? Frac.valueOf(n.multiply(d.frac.d), d.frac.n, d.frac.opt)
        : null;
  }

  public resolve(overflow?: IsOverflow, useFrac?: boolean): Num | Inf {
    return Num.div(this.n, this.d, overflow ?? this.opt, useFrac ?? true);
  }
}
