import { type Num } from "./num.mjs";
import type { IsOverflow } from "./options.mjs";

/** Internal Fraction class */
export class Frac {
  /** numerator */
  public readonly n: Num;

  /** denominator */
  public readonly d: Num;

  public readonly opt: IsOverflow;

  public static valueOf(n: Num, d: Num, overflowOpt: IsOverflow): Frac {
    if (n.frac) this.valueOf(n.frac.n, d.multiply(n.frac.d), overflowOpt);
    if (d.frac) this.valueOf(n.multiply(d.frac.d), d.frac.n, overflowOpt);
    return new Frac(n, d, overflowOpt);
  }

  private constructor(n: Num, d: Num, opt: IsOverflow) {
    this.n = n;
    this.d = d;
    this.opt = opt;
  }

  public multiply(multiplicand: Num): Frac {
    const m = multiplicand;
    return Frac.valueOf(this.n.multiply(m), this.d, this.opt);
  }

  public divide(divisor: Num): Frac {
    const n = this.n;
    const d = this.d.multiply(divisor);
    return Frac.valueOf(n, d, this.opt);
  }

  public divideFrom(dividend: Num): Frac {
    const n = dividend.multiply(this.d);
    const d = this.n;
    return Frac.valueOf(n, d, this.opt);
  }
}
