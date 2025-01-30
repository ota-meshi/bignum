import {
  abs,
  add,
  ceil,
  compareTo,
  divide,
  floor,
  modulo,
  multiply,
  negate,
  round,
  signum,
  trunc,
} from "../frac/operations/basic.mts";
import type { Frac } from "../frac/frac.mts";
import { INF, N_INF, numOf, toString } from "../frac/frac.mts";

const RE_NUMBER = /^([+-]?(?:[1-9]\d*|0)?)(?:\.(\d+))?(?:e([+-]?\d+))?$/iu;

/** Parse a value to a BigNum prop */
function parseValue(
  value: string | number | bigint | boolean | Frac | null | undefined,
): Frac | null {
  if (value == null) return null;
  if (typeof value === "object") return value;
  if (value === Infinity) return INF;
  if (value === -Infinity) return N_INF;
  if (Number.isNaN(value)) return null;
  if (
    typeof value === "boolean" ||
    typeof value === "bigint" ||
    Number.isSafeInteger(value)
  )
    return numOf(BigInt(value));
  return parsePrimValue(value);
}

/** Parse a primitive value to a BigNum prop */
function parsePrimValue(value: string | number): Frac | null {
  const match = RE_NUMBER.exec(String(value));
  if (!match) return null;
  const integer = match[1];
  const decimal = match[2] || "";
  const exponent = match[3] || "0";
  if ((!integer || integer === "+" || integer === "-") && !decimal)
    // Empty numbers. e.g. `+`, `-`, `.`, `+.` or `-.`.
    return null;

  return numOf(
    BigInt(integer + decimal),
    -BigInt(decimal.length) + BigInt(exponent),
  );
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
    return num(this, x && trunc(x));
  }

  /** Returns this BigNum rounded to the nearest integer. */
  public round(): this {
    const x = this.#p;
    return num(this, x && round(x));
  }

  /** Returns the greatest integer less than or equal to this BigNum. */
  public floor(): this {
    const x = this.#p;
    return num(this, x && floor(x));
  }

  /** Returns the smallest integer greater than or equal to this BigNum. */
  public ceil(): this {
    const x = this.#p;
    return num(this, x && ceil(x));
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
    return x != null && Boolean(x.d);
  }

  public toString(): string {
    return toString(this.#p);
  }

  public [Symbol.toPrimitive](
    hint: "default" | "number" | "string",
  ): string | number {
    return hint === "number"
      ? this.toNumber()
      : hint === "string"
        ? this.toString()
        : this.toJSON();
  }

  public toJSON(): string | number {
    const n = this.toNumber();
    if (!this.isFinite()) return n;
    const s = this.toString();
    if (!isFinite(n) || String(n).includes("e")) return s;
    const f1 = parsePrimValue(n)!;
    const f2 = parsePrimValue(s)!;
    return f1.n === f2.n && f1.d === f2.d ? n : s;
  }

  public toNumber(): number {
    const x = this.#p;
    if (!x) return NaN;
    if (!x.d) return x.n > 0 ? Infinity : -Infinity;
    return Number(x.n) / Number(x.d);
  }
}

export { BigNum as BigNumBasic };
