import {
  type FLEngine,
  type FLContext,
  type FLBinaryOperation,
  type FLFunction,
} from "./commons.mjs";
import { compile } from "./compiler.mjs";
import { BigNum } from "./bignum.mjs";
export type {
  FLEngine,
  FLContext,
  FLBinaryOperation,
  FLUnaryOperation,
  FLBinaryOperator,
  FLUnaryOperator,
  FLFunction,
  FLCompiled,
} from "./commons.mjs";

const RE_VALID_INTEGER = /^[+-]?[1-9]\d*$/u;

/** Normalize value */
function normalize(value: BigNum | string | number | bigint) {
  if (value instanceof BigNum || typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (Math.trunc(value) === value) return BigInt(value);
  } else if (typeof value === "string") {
    if (RE_VALID_INTEGER.test(value)) return BigInt(value);
  }
  return BigNum.valueOf(value);
}

/**
 * Build evaluator function
 */
function buildEvaluator(
  evaluateForD: (a: bigint | BigNum, b: bigint | BigNum) => BigNum,
  evaluateForB?: (a: bigint, b: bigint) => bigint,
): FLBinaryOperation<string | number | bigint, BigNum | bigint> {
  const forB = evaluateForB || evaluateForD;
  return (a, b) => {
    const na = normalize(a);
    const nb = normalize(b);
    return typeof na === "bigint" && typeof nb === "bigint"
      ? forB(na, nb)
      : evaluateForD(na, nb);
  };
}

/**
 * Build compare function
 */
function buildCompare(
  compare: <T extends bigint | number>(a: T, b: T) => boolean,
): FLBinaryOperation<string | number | bigint, BigNum | bigint> {
  return (a, b) => {
    const na = normalize(a);
    const nb = normalize(b);
    return BigInt(
      typeof na === "bigint" && typeof nb === "bigint"
        ? compare(na, nb)
        : compare(BigNum.valueOf(na).compareTo(BigNum.valueOf(nb)), 0),
    );
  };
}

/**
 * Build operation function
 */
function buildOperation(
  opForD: (a: BigNum) => BigNum,
  opForB?: (a: bigint) => bigint,
): FLFunction<string | number | bigint, BigNum | bigint> {
  const forB = opForB || ((a) => a);
  return (a) => {
    const na = normalize(a);
    return typeof na === "bigint" ? forB(na) : opForD(na);
  };
}

const defaultContext: FLContext<
  string | number | bigint,
  BigNum | bigint,
  number | string
> = {
  binaryOperations: {
    "*": buildEvaluator(
      (a, b) => BigNum.valueOf(a).multiply(BigNum.valueOf(b)),
      (a, b) => a * b,
    ),
    "+": buildEvaluator(
      (a, b) => BigNum.valueOf(a).add(BigNum.valueOf(b)),
      (a, b) => a + b,
    ),
    "-": buildEvaluator(
      (a, b) => BigNum.valueOf(a).subtract(BigNum.valueOf(b)),
      (a, b) => a - b,
    ),
    "/": buildEvaluator((a, b) => BigNum.valueOf(a).divide(BigNum.valueOf(b))),
    "%": buildEvaluator(
      (a, b) => BigNum.valueOf(a).modulo(BigNum.valueOf(b)),
      (a, b) => a % b,
    ),
    "**": buildEvaluator(
      (a, b) => BigNum.valueOf(a).pow(b),
      (a, b) => a ** b,
    ),
    "==": buildCompare((a, b) => a === b),
    "!=": buildCompare((a, b) => a !== b),
    "<=": buildCompare((a, b) => a <= b),
    "<": buildCompare((a, b) => a < b),
    ">=": buildCompare((a, b) => a >= b),
    ">": buildCompare((a, b) => a > b),
  },
  unaryOperations: {
    "-": buildOperation(
      (a) => a.negate(),
      (a) => -a,
    ),
    "+": (a) => normalize(a),
  },
  normalizeResult: (value) => {
    const str = String(normalize(value));
    const num = Number(str);
    return String(num) === str ? num : str;
  },
  variables: Object.fromEntries(
    (
      ["E", "LN10", "LN2", "LOG2E", "LOG10E", "PI", "SQRT1_2", "SQRT2"] as const
    ).map((k) => [k, Math[k]]),
  ),
  functions: {
    abs: buildOperation(
      (a) => a.abs(),
      (a) => (a < 0 ? -a : a),
    ),
    trunc: buildOperation((a) => a.trunc()),
    round: buildOperation((a) => a.round()),
    floor: buildOperation((a) => a.floor()),
    ceil: buildOperation((a) => a.ceil()),
  },
};

export { compile, BigNum };

export function setupEngine(): FLEngine<
  string | number | bigint,
  number | string
>;
export function setupEngine<
  OPERAND = unknown,
  RESULT = unknown,
  NORMALIZED = unknown,
>(
  context: FLContext<OPERAND, RESULT, NORMALIZED>,
): FLEngine<OPERAND, NORMALIZED>;
/**
 * Setup Formula Literal Engine
 */
export function setupEngine<OPERAND, RESULT, NORMALIZED>(
  context?: FLContext<OPERAND, RESULT, NORMALIZED>,
): FLEngine<OPERAND, NORMALIZED> {
  if (!context) {
    return setupEngine(defaultContext) as any;
  }
  return (template, ...substitutions) => {
    const fn = compile(template);
    return context.normalizeResult(fn(substitutions, context));
  };
}
