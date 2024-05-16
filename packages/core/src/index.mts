import { INF, Inf, N_INF } from "./inf.mjs";
import { Num } from "./num.mjs";
import type { DivideOptions, PowOptions, SqrtOptions } from "./options.mjs";

export * from "./options.mjs";
const RE_NUMBER = /^([+-]?(?:[1-9]\d*|0)?)(?:\.(\d+))?(?:e([+-]?\d+))?$/iu;

/** Parse a value to a BigNum prop */
function parseValue(
  value: string | number | bigint | boolean | Num | Inf | null | undefined,
): Num | Inf | null {
  if (value == null) return null;
  if (value instanceof Num || value instanceof Inf) return value;
  if (value === Infinity) return INF;
  if (value === -Infinity) return N_INF;
  const prop = parsePrimValue(value);
  return prop && new Num(prop.intValue, prop.exponent ?? 0n);
}

/** Parse a primitive value to a BigNum prop */
function parsePrimValue(
  value: string | number | bigint | boolean,
): { intValue: bigint; exponent?: bigint } | null {
  if (typeof value === "boolean" || typeof value === "bigint")
    return { intValue: BigInt(value) };
  if (typeof value === "number") {
    if (Number.isNaN(value)) return null;
    if (Number.isInteger(value)) return { intValue: BigInt(value) };
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

export class BigNum {
  static readonly valueOf = valueOf;

  readonly #p: Inf | Num | null;

  public constructor(
    value:
      | string
      | number
      | bigint
      | boolean
      | BigNum
      | Num
      | Inf
      | null
      | undefined,
  ) {
    if (value instanceof BigNum) {
      this.#p = value.#p;
      return value;
    }
    this.#p = parseValue(value);
  }

  #val(prop: Num | Inf | null | undefined) {
    return prop
      ? this.#p === prop
        ? this
        : new BigNum(prop)
      : new BigNum(NaN);
  }

  /** Returns a number indicating the sign. */
  public signum(): -1 | 0 | 1 | typeof NaN {
    return this.#p?.signum() ?? NaN;
  }

  /** Returns a BigNum whose value is (-this). */
  public negate(): BigNum {
    return this.#val(this.#p?.negate());
  }

  /** Returns a BigNum whose value is (this + augend) */
  public add(augend: BigNum | string | number | bigint): BigNum {
    const b = valueOf(augend).#p;
    return this.#val(b && this.#p?.add(b));
  }

  /** Returns a BigNum whose value is (this - subtrahend) */
  public subtract(subtrahend: BigNum | string | number | bigint): BigNum {
    const b = valueOf(subtrahend).#p;
    return this.#val(b && this.#p?.subtract(b));
  }

  /** Returns a BigNum whose value is (this × multiplicand). */
  public multiply(multiplicand: BigNum | string | number | bigint): BigNum {
    const b = valueOf(multiplicand).#p;
    return this.#val(b && this.#p?.multiply(b));
  }

  /**
   * Returns a BigNum whose value is (this / divisor)
   */
  public divide(
    divisor: BigNum | string | number | bigint,
    options?: DivideOptions,
  ): BigNum {
    const b = valueOf(divisor).#p;
    return this.#val(b && this.#p?.divide(b, options));
  }

  /**
   * Returns a BigNum whose value is (this % divisor)
   */
  public modulo(divisor: BigNum | string | number | bigint): BigNum {
    const b = valueOf(divisor).#p;
    return this.#val(b && this.#p?.modulo(b));
  }

  /**
   * Returns a BigNum whose value is (this**n).
   */
  public pow(
    n: BigNum | string | number | bigint,
    options?: PowOptions,
  ): BigNum {
    const b = valueOf(n).#p;
    return this.#val(b && this.#p?.pow(b, options));
  }

  /** Returns a BigNum whose numerical value is equal to (this * 10 ** n). */
  public scaleByPowerOfTen(n: BigNum | string | number | bigint): BigNum {
    const b = valueOf(n).#p;
    return this.#val(b && this.#p?.scaleByPowerOfTen(b));
  }

  /** Returns an approximation to the square root of this. */
  public sqrt(options?: SqrtOptions): BigNum {
    return this.#val(this.#p?.sqrt(options));
  }

  /** Returns a BigNum whose value is the absolute value of this BigNum. */
  public abs(): BigNum {
    return this.#val(this.#p?.abs());
  }

  /** Returns a BigNum that is the integral part of this BigNum, with removing any fractional digits. */
  public trunc(): BigNum {
    return this.#val(this.#p?.trunc());
  }

  /** Returns this BigNum rounded to the nearest integer. */
  public round(): BigNum {
    return this.#val(this.#p?.round());
  }

  /** Returns the greatest integer less than or equal to this BigNum. */
  public floor(): BigNum {
    return this.#val(this.#p?.floor());
  }

  /** Returns the smallest integer greater than or equal to this BigNum. */
  public ceil(): BigNum {
    return this.#val(this.#p?.ceil());
  }

  /** Compares this BigNum with the specified BigNum. */
  public compareTo(
    other: BigNum | string | number | bigint,
  ): 0 | -1 | 1 | typeof NaN {
    const a = this.#p;
    const b = valueOf(other).#p;
    if (!a || !b) return NaN;
    return a.compareTo(b);
  }

  public isNaN(): boolean {
    return !this.#p;
  }

  public isFinite(): boolean {
    return this.#p != null && !this.#p.inf;
  }

  public toString(): string {
    return this.#p?.toString() ?? "NaN";
  }

  public toJSON(): string | number {
    if (!this.#p) return NaN;
    if (this.#p.inf) return this.#p.toNum();
    const str = this.toString();
    const num = Number(str);
    return String(num) === str ? num : str;
  }
}

/** Get a BigNum from the given value */
function valueOf(value: string | number | bigint | boolean | BigNum): BigNum {
  if (typeof value === "object" && value instanceof BigNum) {
    return value;
  }
  return new BigNum(value);
}
