import {
  abs,
  add,
  compareTo,
  divide,
  modulo,
  multiply,
  negate,
  round,
  signum,
} from "../frac/operations/basic.mts";
import { Frac, INF, N_INF, numOf } from "../frac/frac.mts";
import { ROUND_OPTS } from "../frac/number-context.mts";
import { RoundingMode } from "../options.mjs";

const RE_NUMBER = /^([+-]?(?:[1-9]\d*|0)?)(?:\.(\d+))?(?:e([+-]?\d+))?$/iu;

/** Parse a value to a BigNum prop */
function parseValue(
  value: string | number | bigint | boolean | Frac | null | undefined,
): Frac | null {
  if (value == null) return null;
  if (value instanceof Frac) return value;
  if (value === Infinity) return INF;
  if (value === -Infinity) return N_INF;
  const prop = parsePrimValue(value);
  if (!prop) return null;
  return numOf(prop.intValue, prop.exponent ?? 0n);
}

/** Parse a primitive value to a BigNum prop */
function parsePrimValue(
  value: string | number | bigint | boolean,
): { intValue: bigint; exponent?: bigint } | null {
  if (typeof value === "boolean" || typeof value === "bigint")
    return { intValue: BigInt(value) };
  if (typeof value === "number") {
    if (Number.isNaN(value)) return null;
    if (Number.isSafeInteger(value)) return { intValue: BigInt(value) };
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

/** Get BigNum instance from value */
export let num: <T extends BigNum>(x: T, prop: Frac | null | undefined) => T;
/** Get frac instance from value */
export let frac: (
  value: string | number | bigint | boolean | BigNum,
) => Frac | null;

class BigNum {
  public static valueOf(
    value: string | number | bigint | boolean | BigNum,
  ): BigNum {
    if (value instanceof BigNum) {
      return value;
    }
    return new BigNum(value);
  }

  static #frac(
    value: string | number | bigint | boolean | BigNum,
  ): Frac | null {
    if (value instanceof BigNum) {
      return value.#p;
    }
    return parseValue(value);
  }

  static #num<T extends BigNum>(x: T, prop: Frac | null | undefined): T {
    const Ctor = x.constructor as new (
      value:
        | string
        | number
        | bigint
        | boolean
        | BigNum
        | Frac
        | null
        | undefined,
    ) => T;
    return prop ? (x.#p === prop ? x : new Ctor(prop)) : new Ctor(NaN);
  }

  static {
    num = BigNum.#num;
    frac = BigNum.#frac;
  }

  readonly #p: Frac | null;

  public constructor(
    value:
      | string
      | number
      | bigint
      | boolean
      | BigNum
      | Frac
      | null
      | undefined,
  ) {
    if (value instanceof BigNum) {
      this.#p = value.#p;
      if (value.constructor === new.target) return value;
      // eslint-disable-next-line consistent-return -- OK
      return;
    }
    this.#p = parseValue(value);
  }

  /** Returns a number indicating the sign. */
  public signum(): -1 | 0 | 1 | typeof NaN {
    const x = this.#p;
    return x ? signum(x) : NaN;
  }

  /** Returns a BigNum whose value is `-this`. */
  public negate(): this {
    const x = this.#p;
    return num(this, x && negate(x));
  }

  /** Returns a BigNum whose value is `this + augend`. */
  public add(augend: BigNum | string | number | bigint): this {
    const x = this.#p;
    const y = frac(augend);
    return num(this, x && y && add(x, y));
  }

  /** Returns a BigNum whose value is `this - subtrahend` */
  public subtract(subtrahend: BigNum | string | number | bigint): this {
    const x = this.#p;
    const y = frac(subtrahend);
    return num(this, x && y && add(x, negate(y)));
  }

  /** Returns a BigNum whose value is `this × multiplicand`. */
  public multiply(multiplicand: BigNum | string | number | bigint): this {
    const x = this.#p;
    const y = frac(multiplicand);
    return num(this, x && y && multiply(x, y));
  }

  /**
   * Returns a BigNum whose value is `this / divisor`
   */
  public divide(divisor: BigNum | string | number | bigint): this {
    const x = this.#p;
    const y = frac(divisor);
    return num(this, x && y && divide(x, y));
  }

  /**
   * Returns a BigNum whose value is `this % divisor`
   */
  public modulo(divisor: BigNum | string | number | bigint): this {
    const x = this.#p;
    const y = frac(divisor);
    return num(this, x && y && modulo(x, y));
  }

  /** Returns a BigNum whose value is the absolute value of this BigNum. */
  public abs(): this {
    const x = this.#p;
    return num(this, x && abs(x));
  }

  /** Returns a BigNum that is the integral part of this BigNum, with removing any fractional digits. */
  public trunc(): this {
    const x = this.#p;
    return num(this, x && round(x, ROUND_OPTS[RoundingMode.trunc]));
  }

  /** Returns this BigNum rounded to the nearest integer. */
  public round(): this {
    const x = this.#p;
    return num(this, x && round(x, ROUND_OPTS[RoundingMode.round]));
  }

  /** Returns the greatest integer less than or equal to this BigNum. */
  public floor(): this {
    const x = this.#p;
    return num(this, x && round(x, ROUND_OPTS[RoundingMode.floor]));
  }

  /** Returns the smallest integer greater than or equal to this BigNum. */
  public ceil(): this {
    const x = this.#p;
    return num(this, x && round(x, ROUND_OPTS[RoundingMode.ceil]));
  }

  /** Compares this BigNum with the specified BigNum. */
  public compareTo(
    other: BigNum | string | number | bigint,
  ): 0 | -1 | 1 | typeof NaN {
    const x = this.#p;
    const y = frac(other);
    if (!x || !y) return NaN;
    return compareTo(x, y);
  }

  public isNaN(): boolean {
    return !this.#p;
  }

  public isFinite(): boolean {
    const x = this.#p;
    return x != null && !x.inf;
  }

  public toString(): string {
    return this.#p?.toString() ?? "NaN";
  }

  public toJSON(): string | number {
    const x = this.#p;
    if (!x) return NaN;
    if (x.inf) return x.n > 0 ? Infinity : -Infinity;
    const str = this.toString();
    const nVal = Number(str);
    return String(nVal) === str ? nVal : str;
  }
}

export { BigNum as BigNumBasic };
