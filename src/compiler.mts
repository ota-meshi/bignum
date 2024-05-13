import {
  BINARY_OPERATORS,
  UNARY_OPERATORS,
  type FLCompiled,
  type FLBinaryOperator,
  type FLUnaryOperator,
} from "./commons.mjs";

const reId = /^[\p{ID_Start}$_][\p{ID_Continue}$\u200c\u200d]*$/u;
const enum TokenType {
  punctuator,
  operator,
  operand,
  identifier,
}
type PunctuatorToken = { t: TokenType.punctuator; v: "(" | ")" | "," };
type OperatorToken = {
  t: TokenType.operator;
  v: FLBinaryOperator | FLUnaryOperator;
};
type OperandToken<OPERAND, RESULT> = {
  t: TokenType.operand;
  v: FLCompiled<OPERAND, RESULT>;
};
type IdentifierToken = { t: TokenType.identifier; v: string };
type Token<OPERAND, RESULT> =
  | PunctuatorToken
  | OperatorToken
  | OperandToken<OPERAND, RESULT>
  | IdentifierToken;

const WELLKNOWN_TOKEN: (PunctuatorToken | OperatorToken)[] = [
  ...[...BINARY_OPERATORS, ...UNARY_OPERATORS].map(
    (v): OperatorToken => ({
      t: TokenType.operator,
      v,
    }),
  ),
  { t: TokenType.punctuator, v: "(" } satisfies PunctuatorToken,
  { t: TokenType.punctuator, v: ")" } satisfies PunctuatorToken,
  { t: TokenType.punctuator, v: "," } satisfies PunctuatorToken,
].sort((a, b) => b.v.length - a.v.length);

type Tokenizer<OPERAND, RESULT> = {
  finished: () => boolean;
  next: () => Token<OPERAND, RESULT>;
  lookahead: () => Token<OPERAND, RESULT>;
};

/**
 * Build Tokenizer
 */
function buildTokenizer<OPERAND, RESULT>(
  elements: ArrayLike<string>,
): Tokenizer<OPERAND, RESULT> {
  let finished = false;
  const buffer: Token<OPERAND, RESULT>[] = [];
  let curr = elements[0];
  let index = 0;
  let position = 0;
  updated();

  /** Get next token and consume */
  function next(): Token<OPERAND, RESULT> {
    if (buffer.length) {
      return buffer.shift()!;
    }
    for (const token of WELLKNOWN_TOKEN) {
      if (curr.startsWith(token.v, position)) {
        position += token.v.length;
        updated();
        return token;
      }
    }

    // parse operand
    let value = curr[position++];
    while (position < curr.length) {
      if (!curr[position].trim()) break;
      for (const token of WELLKNOWN_TOKEN) {
        if (curr.startsWith(token.v, position)) {
          break;
        }
      }
      value += curr[position++];
    }
    updated();
    if (reId.test(value)) {
      return { t: TokenType.identifier, v: value };
    }
    return { t: TokenType.operand, v: () => value };
  }

  /** Lookahead token */
  function lookahead(): Token<OPERAND, RESULT> {
    if (buffer.length >= 1) {
      return buffer[0];
    }
    const nextToken = next();
    buffer.unshift(nextToken);
    return nextToken;
  }

  return {
    finished(): boolean {
      return finished && !buffer.length;
    },
    next,
    lookahead,
  };

  /**
   * Postprocess for updated position.
   */
  function updated() {
    if (position < curr.length) {
      if (!curr[position].trim()) {
        // skip spaces
        position++;
        updated();
      }
    } else {
      const curIndex = index;
      if (elements.length <= curIndex + 1) {
        finished = true;
      } else {
        curr = elements[++index];
        position = 0;
        buffer.push({
          t: TokenType.operand,
          v: (params: OPERAND[]) => params[curIndex],
        });
        updated();
      }
    }
  }
}

/**
 * Parse and evaluate a template string with operands.
 */
export function compile<OPERAND, RESULT>(
  templateElements: readonly string[],
): FLCompiled<OPERAND, RESULT> {
  const tokenizer = buildTokenizer<OPERAND, RESULT>(templateElements);
  const result = parse(tokenizer);
  if (!tokenizer.finished()) throw new SyntaxError(`Parsing error`);
  return result;
}

const PRECEDENCE = {
  "**": 14,
  "*": 13,
  "/": 13,
  "%": 13,
  "+": 12,
  "-": 12,
  "<": 10,
  "<=": 10,
  ">": 10,
  ">=": 10,
  "==": 9,
  "!=": 9,
} satisfies Record<FLBinaryOperator, number>;

/**
 * Parse a template string.
 */
function parse<OPERAND, RESULT>(
  tokenizer: Tokenizer<OPERAND, RESULT>,
): FLCompiled<OPERAND, RESULT> {
  return parseOperand().v;

  /** Parse for operand */
  function parseOperand(): OperandToken<OPERAND, RESULT> {
    const stack: Token<OPERAND, RESULT>[] = [];
    let unaryOperator: FLUnaryOperator | null = null;

    while (!tokenizer.finished() && !isCloseParen(tokenizer.lookahead())) {
      const token = tokenizer.next();
      if (token.t === TokenType.punctuator) {
        if (token.v !== "(") {
          throw new SyntaxError(`Unexpected '${token.v}'`);
        }
        const operand = parseOperand();
        if (tokenizer.finished() || !isCloseParen(tokenizer.next())) {
          throw new SyntaxError(`Unterminated paren`);
        }
        stack.push(processOperand(unaryOperator, operand));
        unaryOperator = null;
      } else if (token.t === TokenType.operator) {
        if (unaryOperator)
          // Unary operator that was not consumed.
          throw new SyntaxError(`Unexpected '${token.v}'`);
        if (!stack.length || stack[stack.length - 1].t === TokenType.operator) {
          if (!UNARY_OPERATORS.has(token.v as FLUnaryOperator))
            // It is not Unary operator
            throw new SyntaxError(`Unexpected '${token.v}'`);
          // It is Unary operator
          unaryOperator = token.v as FLUnaryOperator;
        } else {
          if (stack.length >= 3) {
            const beforeOpToken = stack[stack.length - 2];
            if (
              beforeOpToken.t === TokenType.operator &&
              PRECEDENCE[token.v] <= PRECEDENCE[beforeOpToken.v]
            ) {
              stack.push(processBinary(stack));
            }
          }
          stack.push(token);
        }
      } else if (token.t === TokenType.operand) {
        stack.push(processOperand(unaryOperator, token));
        unaryOperator = null;
      } else if (token.t === TokenType.identifier) {
        const args = parseFnArgs();
        if (!args) {
          stack.push(
            processOperand(unaryOperator, {
              t: TokenType.operand,
              v: (_, context) => {
                if (!context.variables || !(token.v in context.variables)) {
                  throw new SyntaxError(`Unknown identifier '${token.v}'`);
                }
                return context.variables[token.v];
              },
            }),
          );
        } else {
          stack.push(
            processOperand(unaryOperator, {
              t: TokenType.operand,
              v: (params, context) => {
                if (!context.functions || !(token.v in context.functions)) {
                  throw new SyntaxError(`Unknown identifier '${token.v}'`);
                }

                return context.functions[token.v](
                  ...args.map((arg) => arg(params, context)),
                );
              },
            }),
          );
        }
      } else {
        throw new SyntaxError("Unexpected token");
      }
    }
    if (unaryOperator)
      // Unary operator that was not consumed.
      throw new SyntaxError(`Unexpected '${unaryOperator}'`);
    while (stack.length > 1) {
      stack.push(processBinary(stack));
    }
    const result = stack[0];
    if (!stack.length || result.t !== TokenType.operand)
      throw new SyntaxError("Expected expression");
    return result;
  }

  /**
   * Process for operand token
   */
  function processOperand(
    unaryOperator: FLUnaryOperator | null,
    token: OperandToken<OPERAND, RESULT>,
  ): OperandToken<OPERAND, RESULT> {
    if (unaryOperator) {
      return {
        t: TokenType.operand,
        v: (params, context) => {
          const unaryOperation = context.unaryOperations[unaryOperator];
          if (!unaryOperation)
            throw new SyntaxError(
              `Unsupported unary operator '${unaryOperator}'`,
            );
          return unaryOperation(token.v(params, context));
        },
      };
    }
    return token;
  }

  /**
   * Process for binary expression
   */
  function processBinary(
    stack: Token<OPERAND, RESULT>[],
  ): OperandToken<OPERAND, RESULT> {
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
    ) {
      throw new SyntaxError(`Parsing error`);
    }
    return {
      t: TokenType.operand,
      v: (params, context) => {
        const binaryOperation = context.binaryOperations[op.v];
        if (!binaryOperation)
          throw new SyntaxError(`Unsupported binary operator '${op.v}'`);
        return binaryOperation(
          left.v(params, context),
          right.v(params, context),
        );
      },
    };
  }

  /**
   * Parse function arguments
   */
  function parseFnArgs(): FLCompiled<OPERAND, RESULT>[] | null {
    if (tokenizer.finished()) return null;
    const firstToken = tokenizer.lookahead();
    if (firstToken.t !== TokenType.punctuator || firstToken.v !== "(")
      return null;

    const args: FLCompiled<OPERAND, RESULT>[] = [];
    let closed = false;
    if (!isCloseParen(tokenizer.lookahead())) {
      tokenizer.next();
      closed = true;
    } else {
      while (!tokenizer.finished()) {
        args.push(parseOperand().v);
        if (tokenizer.finished()) break;
        const nextToken = tokenizer.next();
        if (isComma(nextToken)) {
          continue;
        }
        if (isCloseParen(nextToken)) {
          closed = true;
        }
        break;
      }
    }
    if (!closed) throw new SyntaxError(`Unterminated paren`);
    return args;
  }
}

/**
 * Checks whether the token is a close parenthesis.
 */
function isCloseParen(token: Token<any, any>): token is PunctuatorToken {
  return token.t === TokenType.punctuator && token.v === ")";
}

/**
 * Checks whether the token is a comma.
 */
function isComma(token: Token<any, any>): token is PunctuatorToken {
  return token.t === TokenType.punctuator && token.v === ",";
}
