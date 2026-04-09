import { BigNum } from "@bignum/core";
import type { BTBinaryOperation, BTFunction } from "@bignum/shared";
export { BigNum };

const RE_VALID_INTEGER = /^[+-]?(?:[1-9]\d*|0)$/u;

/**
 * Normalize result value
 */
export function toResult(
  value: BigNum | string | number | bigint,
): string | number {
  const normalized = normalize(value);
  const str = String(normalized);
  const num = Number(str);
  return String(num) === str ? num : str;
}

/** Normalize value */
export function normalize(
  value: BigNum | string | number | bigint,
): bigint | BigNum {
  if (value instanceof BigNum || typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (Number.isSafeInteger(value)) return BigInt(value);
  } else if (typeof value === "string") {
    if (RE_VALID_INTEGER.test(value)) return BigInt(value);
  }
  return BigNum.valueOf(value);
}
export const add = buildEvaluator(
  (a, b) => a.add(b),
  (a, b) => a + b,
);
export const multiply = buildEvaluator(
  (a, b) => a.multiply(b),
  (a, b) => a * b,
);
export const subtract = buildEvaluator(
  (a, b) => a.subtract(b),
  (a, b) => a - b,
);
export const divide = buildEvaluator((a, b) => a.divide(b));
export const modulo = buildEvaluator(
  (a, b) => a.modulo(b),
  (a, b) => a % b,
);
export const pow = buildEvaluator(
  (a, b) => a.pow(b),
  (a, b) => a ** b,
);
export const equal = buildCompare((a, b) => a === b);
export const notEqual = buildCompare((a, b) => a !== b);
export const lte = buildCompare((a, b) => a <= b);
export const lt = buildCompare((a, b) => a < b);
export const gte = buildCompare((a, b) => a >= b);
export const gt = buildCompare((a, b) => a > b);
export const negate = buildOperation(
  (a) => a.negate(),
  (a) => -a,
);
export const sqrt = buildOperation((a) => a.sqrt());
export const abs = buildOperation(
  (a) => a.abs(),
  (a) => (a < 0 ? -a : a),
);
export const trunc = buildOperation(
  (a, dp) => a.trunc(dp),
  (a, dp) => {
    return withDPFactor(a, dp, (factor) => truncWithFactor(a, factor));
  },
);

export const round = buildOperation(
  (a, dp) => a.round(dp),
  (a, dp) => {
    return withDPFactor(a, dp, (factor) => {
      const mod = a % factor;
      if (!mod) return a;
      const dblMod = (mod < 0n ? -mod : mod) * 2n;
      return (a < 0n ? dblMod > factor : dblMod >= factor)
        ? (a / factor + (a < 0n ? -1n : 1n)) * factor
        : truncWithFactor(a, factor);
    });
  },
);
export const floor = buildOperation(
  (a, dp) => a.floor(dp),
  (a, dp) => {
    return withDPFactor(a, dp, (factor) => {
      return a % factor
        ? a < 0n
          ? truncWithFactor(a, factor) - factor
          : truncWithFactor(a, factor)
        : a;
    });
  },
);
export const ceil = buildOperation(
  (a, dp) => a.ceil(dp),
  (a, dp) => {
    return withDPFactor(a, dp, (factor) => {
      return a % factor
        ? a < 0n
          ? truncWithFactor(a, factor)
          : truncWithFactor(a, factor) + factor
        : a;
    });
  },
);

/**
 * Build evaluator function
 */
function buildEvaluator(
  evalForD: (a: BigNum, b: string | number | bigint | BigNum) => BigNum,
  evalForB?: (a: bigint, b: bigint) => bigint,
): BTBinaryOperation<string | number | bigint, BigNum | bigint> {
  const forD = (
    a: string | number | bigint | BigNum,
    b: string | number | bigint | BigNum,
  ) => evalForD(BigNum.valueOf(a), b);
  if (!evalForB) {
    return forD;
  }
  return (a, b) => {
    const na = normalize(a);
    const nb = normalize(b);
    return typeof na === "bigint" && typeof nb === "bigint"
      ? evalForB(na, nb)
      : forD(na, nb);
  };
}

/**
 * Build compare function
 */
function buildCompare(
  compare: <T extends bigint | number>(a: T, b: T) => boolean,
): BTBinaryOperation<string | number | bigint, BigNum | bigint> {
  return (a, b) => {
    const na = normalize(a);
    const nb = normalize(b);
    return BigInt(
      typeof na === "bigint" && typeof nb === "bigint"
        ? compare(na, nb)
        : compare(BigNum.valueOf(na).compareTo(nb), 0),
    );
  };
}

/**
 * Build operation function
 */
function buildOperation(
  opForD: (
    a: BigNum,
    ...options: (string | number | bigint | BigNum | undefined)[]
  ) => BigNum,
  opForB?: (
    a: bigint,
    ...options: (string | number | bigint | BigNum | undefined)[]
  ) => bigint | BigNum /* NaN */,
): BTFunction<string | number | bigint, BigNum | bigint> {
  if (!opForB) return (a, ...options) => opForD(BigNum.valueOf(a), ...options);
  return (a, ...options) => {
    const na = normalize(a);
    return typeof na === "bigint"
      ? opForB(na, ...options)
      : opForD(na, ...options);
  };
}

/**
 * Apply operation with decimal place factor if needed.
 */
function withDPFactor(
  a: bigint,
  dp: string | number | bigint | BigNum | undefined,
  op: (factor: bigint) => bigint,
): bigint | BigNum {
  if (dp == null) return a;
  const normalizedDp = normalize(dp);
  let integerDp: bigint;
  if (typeof normalizedDp === "bigint") {
    integerDp = normalizedDp;
  } else {
    const s = String(normalizedDp);
    if (!RE_VALID_INTEGER.test(s)) return BigNum.valueOf(NaN);
    integerDp = BigInt(s);
  }
  if (integerDp >= 0n) return a;
  return op(10n ** -integerDp);
}

/**
 * Truncate the bigint to the nearest multiple of the factor toward zero.
 */
function truncWithFactor(a: bigint, factor: bigint): bigint {
  return (a / factor) * factor;
}
