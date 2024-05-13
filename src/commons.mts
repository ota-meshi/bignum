export type FLBinaryOperation<OPERAND, RESULT> = (
  a: OPERAND | RESULT | string,
  b: OPERAND | RESULT | string,
) => RESULT;
export type FLUnaryOperation<OPERAND, RESULT> = (
  a: OPERAND | RESULT | string,
) => RESULT;
export type FLContext<OPERAND, RESULT, NORMALIZED> = {
  binaryOperations: {
    [k in FLBinaryOperator]?: FLBinaryOperation<OPERAND, RESULT>;
  };
  unaryOperations: {
    [k in FLUnaryOperator]?: FLUnaryOperation<OPERAND, RESULT>;
  };
  variables?: Record<string, OPERAND>;
  functions?: Record<string, FLFunction<OPERAND, RESULT>>;
  normalizeResult: (value: OPERAND | RESULT | string) => NORMALIZED;
};
export type FLEngine<OPERAND, NORMALIZE> = (
  template: TemplateStringsArray,
  ...substitutions: OPERAND[]
) => NORMALIZE;
export type FLFunction<OPERAND, RESULT> = (
  ...args: (OPERAND | RESULT | string)[]
) => RESULT;
export type FLCompiled<OPERAND, RESULT> = (
  params: OPERAND[],
  context: FLContext<OPERAND, RESULT, unknown>,
) => RESULT | OPERAND | string;

const BINARY_OPERATOR_ARRAY = [
  // Arithmetic operators
  "+",
  "-",
  "*",
  "/",
  "%",
  "**",
  // Logical operators
  "<",
  "<=",
  ">",
  ">=",
  "==",
  "!=",
] as const;
export type FLBinaryOperator = (typeof BINARY_OPERATOR_ARRAY)[number];
export const BINARY_OPERATORS = new Set(BINARY_OPERATOR_ARRAY);
const UNARY_OPERATOR_ARRAY = ["+", "-"] as const;
export type FLUnaryOperator = (typeof UNARY_OPERATOR_ARRAY)[number];
export const UNARY_OPERATORS = new Set(UNARY_OPERATOR_ARRAY);
