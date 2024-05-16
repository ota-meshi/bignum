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
  "**": [130, 131], // right-to-left
  // 12: multiplicative operators
  "*": [121, 120], // left-to-right
  "/": [121, 120], // left-to-right
  "%": [121, 120], // left-to-right
  // 11: additive operators
  "+": [111, 110], // left-to-right
  "-": [111, 110], // left-to-right
  // 10: bitwise shift
  "<<": [101, 100], // left-to-right
  ">>": [101, 100], // left-to-right
  ">>>": [101, 100], // left-to-right
  // 9: relational operators
  "<": [91, 90], // left-to-right
  "<=": [91, 90], // left-to-right
  ">": [91, 90], // left-to-right
  ">=": [91, 90], // left-to-right
  // 8: equality operators
  "==": [81, 80], // left-to-right
  "!=": [81, 80], // left-to-right
  // 7: bitwise AND
  "&": [71, 70], // left-to-right
  // 6: bitwise XOR
  "^": [61, 60], // left-to-right
  // 5: bitwise OR
  "|": [51, 50], // left-to-right
  // 4: logical AND
  "&&": [41, 40], // left-to-right
  // 3: logical OR, nullish coalescing
  "||": [31, 30], // left-to-right
  "??": [31, 30], // left-to-right
} as const;
export type BTBinaryOperator = keyof typeof PRECEDENCE;
export const BINARY_OPERATORS = new Set(
  Object.keys(PRECEDENCE) as BTBinaryOperator[],
);
const UNARY_OPERATOR_ARRAY = ["+", "-"] as const;
export type BTUnaryOperator = (typeof UNARY_OPERATOR_ARRAY)[number];
export const UNARY_OPERATORS = new Set(UNARY_OPERATOR_ARRAY);
