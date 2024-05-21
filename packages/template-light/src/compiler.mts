import { valueOf, type Frac } from "./frac.mts";

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

const BINARY_OPERATIONS = {
  "+": (a: Frac, b: Frac) => a.add(b),
  "-": (a: Frac, b: Frac) => a.sub(b),
  "*": (a: Frac, b: Frac) => a.mul(b),
  "/": (a: Frac, b: Frac) => a.div(b),
  "%": (a: Frac, b: Frac) => a.mod(b),
} as const;

type Compiled = <OPERAND extends string | number | bigint>(
  params: OPERAND[],
) => Frac;

const enum TokenType {
  paren,
  operator,
  operand,
}
type PunctuatorToken = { t: TokenType.paren; v: "(" | ")" };
type OperatorToken = {
  t: TokenType.operator;
  v: BinaryOperator;
};
type OperandToken = {
  t: TokenType.operand;
  v: Compiled;
};
type Token = PunctuatorToken | OperatorToken | OperandToken;

const RE_SP = /\s*/uy;

const TOKENS: (PunctuatorToken | OperatorToken)[] = [
  { t: TokenType.paren, v: "(" },
  { t: TokenType.paren, v: ")" },
  ...[...BINARY_OPERATORS].map(
    (v): OperatorToken => ({
      t: TokenType.operator,
      v,
    }),
  ),
];

type Tokenizer = {
  finished: () => boolean;
  next: () => Token;
};

/**
 * Build Tokenizer
 */
function buildTokenizer(elements: readonly string[]): Tokenizer {
  const buffer: OperandToken[] = [];
  let index = 0;
  let position = 0;
  updated();

  /** Get next token and consume */
  function next(): Token {
    if (buffer.length) return buffer.shift()!;
    const curr = elements[index];
    for (const token of TOKENS) {
      if (token.v === curr[position]) {
        position += 1;
        updated();
        return token;
      }
    }
    throw new SyntaxError(`Unexpected token`);
  }

  return {
    finished: () => elements.length <= index && !buffer.length,
    next,
  };

  /** Postprocess for updated position. */
  function updated() {
    const curr = elements[index];
    RE_SP.lastIndex = position;
    position += RE_SP.exec(curr)![0].length;
    if (position >= curr.length) {
      const curIndex = index;
      index++;
      if (elements.length > index) {
        position = 0;
        buffer.push({
          t: TokenType.operand,
          v: (params) => valueOf(params[curIndex]),
        });
        updated();
      }
    }
  }
}

/**
 * Parse and evaluate a template string with operands.
 */
export function compile(templateElements: readonly string[]): Compiled {
  const tokenizer = buildTokenizer(templateElements);
  const result = parse(tokenizer);
  if (!tokenizer.finished()) throw new SyntaxError(`Parsing error`);
  return result;
}

/**
 * Parse a template string.
 */
function parse(tokenizer: Tokenizer): Compiled {
  return parseOperand(false).v;

  /** Parse for operand */
  function parseOperand(inParen: boolean): OperandToken {
    const stack: Token[] = [];
    let hasCloseParen = false;

    while (!tokenizer.finished()) {
      const token = tokenizer.next();
      if (token.t === TokenType.paren) {
        if (token.v === ")") {
          if (!inParen) throw new SyntaxError(`Unexpected token: ${token.v}`);
          hasCloseParen = true;
          break;
        }
        const operand = parseOperand(true);
        stack.push(operand);
      } else if (token.t === TokenType.operator) {
        if (stack.length >= 3) {
          const beforeOpToken = stack[stack.length - 2];
          if (
            beforeOpToken.t === TokenType.operator &&
            PRECEDENCE[token.v] <= PRECEDENCE[beforeOpToken.v]
          )
            stack.push(processBinary(stack));
        }
        stack.push(token);
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
  function processBinary(stack: Token[]): OperandToken {
    const right = stack.pop();
    const op = stack.pop();
    const left = stack.pop();

    if (
      !left ||
      left.t !== TokenType.operand ||
      !op ||
      op.t !== TokenType.operator ||
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
