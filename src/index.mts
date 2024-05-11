import { evaluate } from "./evaluator.mjs";
import { numberContext, type FLEngine, type FLContext } from "./commons.mjs";
export type {
  FLEngine,
  FLContext,
  FLBinaryOperation,
  FLUnaryOperation,
  FLBinaryOperator,
  FLUnaryOperator,
  FLFunction,
} from "./commons.mjs";

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
  return (template, ...substitutions) =>
    evaluate(template, substitutions, context);
}
