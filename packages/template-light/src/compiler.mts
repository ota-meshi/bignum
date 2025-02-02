import { add, div, mod, mul, sub } from "./core.mts";
import type { Frac } from "./frac.mts";

// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence
const PRECEDENCE = {
  // 12: multiplicative operators
  "*": 12,
  "/": 12,
  "%": 12,
  // 11: additive operators
  "+": 11,
  "-": 11,
} as const;
type BinaryOperator = keyof typeof PRECEDENCE;
const BINARY_OPERATORS = new Set(Object.keys(PRECEDENCE) as BinaryOperator[]);
const enum Paren {
  open = "(",
  close = ")",
}

const BINARY_OPERATIONS = {
  "+": (a: Frac, b: Frac) => add(a, b),
  "-": (a: Frac, b: Frac) => sub(a, b),
  "*": (a: Frac, b: Frac) => mul(a, b),
  "/": (a: Frac, b: Frac) => div(a, b),
  "%": (a: Frac, b: Frac) => mod(a, b),
} as const;

type Compiled = (params: Frac[]) => Frac;

const enum TokenType {
  punctuator,
  operand,
}
type PunctuatorToken<V> = V extends infer E extends string
  ? { t: TokenType.punctuator; v: E }
  : never;
type ParenToken = PunctuatorToken<Paren>;
type OperatorToken = PunctuatorToken<BinaryOperator>;
type OperandToken = { t: TokenType.operand; v: Compiled };
type Token = ParenToken | OperatorToken | OperandToken;

const TOKEN_CHARS: Set<Paren | BinaryOperator> = new Set([
  ...BINARY_OPERATORS,
  Paren.open,
  Paren.close,
]);

/**
 * Template elements to tokens
 */
function* tokens(elements: readonly string[]): Iterable<Token> {
  for (const [index, element] of elements.entries()) {
    for (const ch of element.split(/\s*/u).filter(Boolean)) {
      if (!TOKEN_CHARS.has(ch as Paren | BinaryOperator))
        throw new SyntaxError(`Unexpected character: ${ch}`);
      yield {
        t: TokenType.punctuator,
        v: ch as Paren | BinaryOperator,
      };
    }
    if (elements.length > index + 1) {
      yield {
        t: TokenType.operand,
        v: (params) => params[index],
      };
    }
  }
}

/**
 * Parse and evaluate a template string with operands.
 */
export function compile(templateElements: readonly string[]): Compiled {
  const tokenizer = tokens(templateElements)[Symbol.iterator]();
  const result = parse(tokenizer);
  if (!tokenizer.next().done) throw new SyntaxError(`Parsing error`);
  return result;
}

/**
 * Parse a template string.
 */
function parse(tokenizer: Iterator<Token>): Compiled {
  return parseOperand(false).v;

  /** Parse for operand */
  function parseOperand(inParen: boolean): OperandToken {
    const stack: (OperandToken | OperatorToken)[] = [];
    let hasCloseParen = false;

    while (true) {
      const tokenResult = tokenizer.next();
      if (tokenResult.done) break;
      const token = tokenResult.value;
      if (token.t === TokenType.punctuator) {
        if (token.v === Paren.close) {
          if (!inParen) throw new SyntaxError(`Unexpected token: ${token.v}`);
          hasCloseParen = true;
          break;
        }
        if (token.v === Paren.open) {
          const operand = parseOperand(true);
          stack.push(operand);
        } else {
          if (stack.length >= 3) {
            const beforeOpToken = stack[stack.length - 2];
            if (
              beforeOpToken.t === TokenType.punctuator &&
              PRECEDENCE[token.v] <= PRECEDENCE[beforeOpToken.v]
            )
              stack.push(processBinary(stack));
          }
          stack.push(token);
        }
      } else if (token.t === TokenType.operand) {
        stack.push(token);
      } else {
        throw new SyntaxError("Unexpected token");
      }
    }
    if (inParen && !hasCloseParen) throw new SyntaxError("Unterminated paren");
    while (stack.length > 1) stack.push(processBinary(stack));
    const result = stack[0];
    if (result?.t !== TokenType.operand)
      throw new SyntaxError("Expected expression");
    return result;
  }

  /**
   * Process for binary expression
   */
  function processBinary(
    stack: (OperandToken | OperatorToken)[],
  ): OperandToken {
    const right = stack.pop();
    const op = stack.pop();
    const left = stack.pop();

    if (
      !left ||
      left.t !== TokenType.operand ||
      !op ||
      op.t !== TokenType.punctuator ||
      !BINARY_OPERATORS.has(op.v) ||
      !right ||
      right.t !== TokenType.operand
    )
      throw new SyntaxError(`Parsing error`);
    return {
      t: TokenType.operand,
      v: (params) => {
        return BINARY_OPERATIONS[op.v](left.v(params), right.v(params));
      },
    };
  }
}
