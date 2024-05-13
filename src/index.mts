import { type FLEngine, type FLContext } from "./commons.mjs";
import { compile } from "./compiler.mjs";
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

const numberContext: FLContext<unknown, number, number> = {
  binaryOperations: {
    "*": (a, b) => (a as any) * (b as any),
    "+": (a, b) => Number(a) + Number(b),
    "-": (a, b) => (a as any) - (b as any),
    "/": (a, b) => (a as any) / (b as any),
    "%": (a, b) => (a as any) % (b as any),
    "**": (a, b) => (a as any) ** (b as any),
  },
  unaryOperations: {
    "-": (a) => -(a as any),
    "+": (a) => Number(a),
  },
  normalizeResult: (value) => Number(value),
  variables: Math as any,
  functions: Math as any,
};

export { compile };

export function setupEngine(): FLEngine<unknown, number>;
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
    return setupEngine(numberContext) as FLEngine<OPERAND, NORMALIZED>;
  }
  return (template, ...substitutions) => {
    const fn = compile(template);
    return context.normalizeResult(fn(substitutions, context));
  };
}