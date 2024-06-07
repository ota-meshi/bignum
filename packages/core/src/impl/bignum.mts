import {
  nthRoot,
  parse,
  pow,
  scaleByPowerOfTen,
  sqrt,
} from "../frac/operations/arithmetic.mts";
import { type MathOptions } from "../options.mjs";
import { BigNumBasic, frac, num } from "./bignum-basic.mts";

export class BigNum extends BigNumBasic {
  public static valueOf(
    value: string | number | bigint | boolean | BigNum,
  ): BigNum {
    if (value instanceof BigNum) {
      return value;
    }
    return new BigNum(value);
  }

  public static parse(str: string, radix: number): BigNum {
    return new BigNum(parse(str, radix));
  }

  /** Returns a BigNum whose value is `this**n`. */
  public pow(
    n: BigNum | string | number | bigint,
    options?: MathOptions,
  ): this {
    const x = frac(this);
    const y = frac(n);
    return num(this, x && y && pow(x, y, options));
  }

  /** Returns a BigNum whose numerical value is equal to `this * 10 ** n`. */
  public scaleByPowerOfTen(n: BigNum | string | number | bigint): this {
    const x = frac(this);
    const y = frac(n);
    return num(this, x && y && scaleByPowerOfTen(x, y));
  }

  /** Returns an approximation to the square root of this. */
  public sqrt(options?: MathOptions): this {
    const x = frac(this);
    return num(this, x && sqrt(x, options));
  }

  /** Returns an approximation to the nth root of this. */
  public nthRoot(
    n: BigNum | string | number | bigint,
    options?: MathOptions,
  ): this {
    const x = frac(this);
    const y = frac(n);
    return num(this, x && y && nthRoot(x, y, options));
  }
}
