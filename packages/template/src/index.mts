import {
  type BTEngine,
  type BTContext,
  type BTBinaryOperation,
  type BTFunction,
} from "@bignum/shared";
import { compile } from "@bignum/template-compiler";
import { BigNum } from "@bignum/core";
import { toResult } from "./core.mts";
export type {
  BTEngine,
  BTContext,
  BTBinaryOperation,
  BTUnaryOperation,
  BTBinaryOperator,
  BTUnaryOperator,
  BTFunction,
  BTCompiled,
} from "@bignum/shared";

const RE_VALID_INTEGER = /^[+-]?(?:[1-9]\d*|0)$/u;

/** Normalize value */
function normalize(value: BigNum | string | number | bigint) {
  if (value instanceof BigNum || typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (Number.isSafeInteger(value)) return BigInt(value);
  } else if (typeof value === "string") {
    if (RE_VALID_INTEGER.test(value)) return BigInt(value);
  }
  return BigNum.valueOf(value);
}

/** Identity function */
function identity<T>(a: T): T {
  return a;
}

/**
 * Build evaluator function
 */
function buildEvaluator(
  evaluateForD: (a: BigNum, b: BigNum | bigint) => BigNum,
  evaluateForB?: (a: bigint, b: bigint) => bigint,
): BTBinaryOperation<string | number | bigint, BigNum | bigint> {
  const forD = (a: BigNum | bigint, b: BigNum | bigint) =>
    evaluateForD(BigNum.valueOf(a), b);
  const forB = evaluateForB || forD;
  return (a, b) => {
    const na = normalize(a);
    const nb = normalize(b);
    return typeof na === "bigint" && typeof nb === "bigint"
      ? forB(na, nb)
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
    ...options: (string | number | bigint | BigNum | bigint)[]
  ) => BigNum,
  opForB?: (
    a: bigint,
    ...options: (string | number | bigint | BigNum | bigint)[]
  ) => bigint,
): BTFunction<string | number | bigint, BigNum | bigint> {
  const forB =
    opForB || ((a, ...options) => opForD(BigNum.valueOf(a), ...options));
  return (a, ...options) => {
    const na = normalize(a);
    return typeof na === "bigint"
      ? forB(na, ...options)
      : opForD(na, ...options);
  };
}

const defaultContext: BTContext<
  string | number | bigint,
  BigNum | bigint,
  number | string
> = {
  binaryOperations: {
    "*": buildEvaluator(
      (a, b) => a.multiply(b),
      (a, b) => a * b,
    ),
    "+": buildEvaluator(
      (a, b) => a.add(b),
      (a, b) => a + b,
    ),
    "-": buildEvaluator(
      (a, b) => a.subtract(b),
      (a, b) => a - b,
    ),
    "/": buildEvaluator((a, b) => a.divide(b)),
    "%": buildEvaluator(
      (a, b) => a.modulo(b),
      (a, b) => a % b,
    ),
    "**": buildEvaluator(
      (a, b) => a.pow(b),
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
    return toResult(normalize(value));
  },
  variables: Object.fromEntries(
    (
      ["E", "LN10", "LN2", "LOG2E", "LOG10E", "PI", "SQRT1_2", "SQRT2"] as const
    ).map((k) => [k, Math[k]]),
  ),
  functions: {
    sqrt: buildOperation((a) => a.sqrt()),
    abs: buildOperation(
      (a) => a.abs(),
      (a) => (a < 0 ? -a : a),
    ),
    trunc: buildOperation((a) => a.trunc(), identity),
    round: buildOperation((a) => a.round(), identity),
    floor: buildOperation((a) => a.floor(), identity),
    ceil: buildOperation((a) => a.ceil(), identity),
  },
};

export function setupEngine(): BTEngine<
  string | number | bigint,
  number | string
>;
export function setupEngine<
  OPERAND = unknown,
  RESULT = unknown,
  NORMALIZED = OPERAND | RESULT | string,
>(
  context: BTContext<OPERAND, RESULT, NORMALIZED>,
): BTEngine<OPERAND, NORMALIZED>;
/**
 * Setup Formula Literal Engine
 */
export function setupEngine<
  OPERAND,
  RESULT,
  NORMALIZED = OPERAND | RESULT | string,
>(
  context?: BTContext<OPERAND, RESULT, NORMALIZED>,
): BTEngine<OPERAND, NORMALIZED> {
  if (!context) {
    return setupEngine(defaultContext) as any;
  }
  return (template, ...substitutions) => {
    const fn = compile(template);
    const result = fn(substitutions, context);
    return context.normalizeResult
      ? context.normalizeResult(result)
      : (result as NORMALIZED);
  };
}
export const f = setupEngine();
