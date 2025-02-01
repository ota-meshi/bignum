import { type BTEngine, type BTContext } from "@bignum/shared";
import { compile } from "@bignum/template-compiler";
import type { BigNum } from "@bignum/core";
import {
  abs,
  add,
  ceil,
  divide,
  equal,
  floor,
  gt,
  gte,
  lt,
  lte,
  modulo,
  multiply,
  negate,
  normalize,
  notEqual,
  pow,
  round,
  sqrt,
  subtract,
  toResult,
  trunc,
} from "./core.mts";
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

const defaultContext: BTContext<
  string | number | bigint,
  BigNum | bigint,
  number | string
> = {
  binaryOperations: {
    "*": multiply,
    "+": add,
    "-": subtract,
    "/": divide,
    "%": modulo,
    "**": pow,
    "==": equal,
    "!=": notEqual,
    "<=": lte,
    "<": lt,
    ">=": gte,
    ">": gt,
  },
  unaryOperations: {
    "-": negate,
    "+": (a) => normalize(a),
  },
  normalizeResult: (value) => {
    return toResult(value);
  },
  variables: Object.fromEntries(
    (
      ["E", "LN10", "LN2", "LOG2E", "LOG10E", "PI", "SQRT1_2", "SQRT2"] as const
    ).map((k) => [k, Math[k]]),
  ),
  functions: {
    sqrt,
    abs,
    trunc,
    round,
    floor,
    ceil,
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
