export type BTBinaryOperation<OPERAND, RESULT> = (
  a: OPERAND | RESULT | string,
  b: OPERAND | RESULT | string,
) => RESULT;
export type BTUnaryOperation<OPERAND, RESULT> = (
  a: OPERAND | RESULT | string,
) => RESULT;
export type BTContext<
  OPERAND,
  RESULT,
  NORMALIZED = OPERAND | RESULT | string,
> = {
  binaryOperations?: {
    [k in BTBinaryOperator]?: BTBinaryOperation<OPERAND, RESULT>;
  };
  unaryOperations?: {
    [k in BTUnaryOperator]?: BTUnaryOperation<OPERAND, RESULT>;
  };
  variables?: Record<string, OPERAND>;
  functions?: Record<string, BTFunction<OPERAND, RESULT>>;
  normalizeResult?: (value: OPERAND | RESULT | string) => NORMALIZED;
};
export type BTEngine<OPERAND, NORMALIZE> = (
  template: TemplateStringsArray,
  ...substitutions: OPERAND[]
) => NORMALIZE;
export type BTFunction<OPERAND, RESULT> = (
  ...args: (OPERAND | RESULT | string)[]
) => RESULT;
export type BTCompiled = <OPERAND, RESULT>(
  params: OPERAND[],
  context: BTContext<OPERAND, RESULT, unknown>,
) => RESULT | OPERAND | string;

// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence
export const PRECEDENCE = {
  // 13: exponentiation
  "**": 13,
  // 12: multiplicative operators
  "*": 12,
  "/": 12,
  "%": 12,
  // 11: additive operators
  "+": 11,
  "-": 11,
  // 10: bitwise shift
  "<<": 10,
  ">>": 10,
  ">>>": 10,
  // 9: relational operators
  "<": 9,
  "<=": 9,
  ">": 9,
  ">=": 9,
  // 8: equality operators
  "==": 8,
  "!=": 8,
  // 7: bitwise AND
  "&": 7,
  // 6: bitwise XOR
  "^": 6,
  // 5: bitwise OR
  "|": 5,
  // 4: logical AND
  "&&": 4,
  // 3: logical OR, nullish coalescing
  "||": 3,
  "??": 3,
} as const;
export type BTBinaryOperator = keyof typeof PRECEDENCE;
export const BINARY_OPERATORS = new Set(
  Object.keys(PRECEDENCE) as BTBinaryOperator[],
);
const UNARY_OPERATOR_ARRAY = ["+", "-"] as const;
export type BTUnaryOperator = (typeof UNARY_OPERATOR_ARRAY)[number];
export const UNARY_OPERATORS = new Set(UNARY_OPERATOR_ARRAY);
