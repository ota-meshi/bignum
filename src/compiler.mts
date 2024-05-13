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
type OperandToken = {
  t: TokenType.operand;
  v: FLCompiled;
};
type IdentifierToken = { t: TokenType.identifier; v: string };
type Token = PunctuatorToken | OperatorToken | OperandToken | IdentifierToken;

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

type Tokenizer = {
  finished: () => boolean;
  next: () => Token;
  lookahead: () => Token | null;
};

/** Identity function */
function identity(token: OperandToken): OperandToken {
  return token;
}

/**
 * Build Tokenizer
 */
function buildTokenizer(elements: ArrayLike<string>): Tokenizer {
  let finished = false;
  const buffer: Token[] = [];
  let curr = elements[0];
  let index = 0;
  let position = 0;
  updated();

  /** Get next token and consume */
  function next(): Token {
    if (buffer.length) return buffer.shift()!;
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
      if (WELLKNOWN_TOKEN.some((token) => curr.startsWith(token.v, position)))
        break;
      value += curr[position++];
    }
    updated();
    return reId.test(value)
      ? { t: TokenType.identifier, v: value }
      : { t: TokenType.operand, v: () => value };
  }

  /** Lookahead token */
  function lookahead(): Token | null {
    if (buffer.length) return buffer[0];
    if (finished) return null;
    const nextToken = next();
    buffer.unshift(nextToken);
    return nextToken;
  }

  return {
    finished: () => finished && !buffer.length,
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
          v: (params) => params[curIndex],
        });
        updated();
      }
    }
  }
}

/**
 * Parse and evaluate a template string with operands.
 */
export function compile(templateElements: readonly string[]): FLCompiled {
  const tokenizer = buildTokenizer(templateElements);
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
function parse(tokenizer: Tokenizer): FLCompiled {
  return parseOperand().v;

  /** Parse for operand */
  function parseOperand(): OperandToken {
    const stack: Token[] = [];

    let processOperand = identity;

    while (!tokenizer.finished() && !isCloseParen(tokenizer.lookahead())) {
      const token = tokenizer.next();
      if (token.t === TokenType.punctuator) {
        if (token.v !== "(") throw new SyntaxError(`Unexpected '${token.v}'`);
        const operand = parseOperand();
        if (tokenizer.finished() || !isCloseParen(tokenizer.next()))
          throw new SyntaxError(`Unterminated paren`);
        stack.push(processOperand(operand));
      } else if (token.t === TokenType.operator) {
        if (!stack.length || stack[stack.length - 1].t === TokenType.operator) {
          if (!UNARY_OPERATORS.has(token.v as FLUnaryOperator))
            // It is not Unary operator
            throw new SyntaxError(`Unexpected '${token.v}'`);
          const next = tokenizer.lookahead();
          if (next?.t === TokenType.operator)
            // Unary operator that was not consumed.
            throw new SyntaxError(`Unexpected '${token.v}'`);
          // It is Unary operator
          const unaryOperator = token.v as FLUnaryOperator;
          processOperand = (t) => {
            processOperand = identity;
            return processUnary(unaryOperator, t);
          };
        } else {
          if (stack.length >= 3) {
            const beforeOpToken = stack[stack.length - 2];
            if (
              beforeOpToken.t === TokenType.operator &&
              PRECEDENCE[token.v] <= PRECEDENCE[beforeOpToken.v]
            )
              stack.push(processBinary(stack));
          }
          stack.push(token);
        }
      } else if (token.t === TokenType.operand) {
        stack.push(processOperand(token));
      } else if (token.t === TokenType.identifier) {
        const firstToken = tokenizer.lookahead();
        if (firstToken?.t !== TokenType.punctuator || firstToken.v !== "(") {
          stack.push(
            processOperand({
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
          const args = parseFnArgs();
          stack.push(
            processOperand({
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
    while (stack.length > 1) stack.push(processBinary(stack));
    const result = stack[0];
    if (!stack.length || result.t !== TokenType.operand)
      throw new SyntaxError("Expected expression");
    return result;
  }

  /**
   * Process for unary expression
   */
  function processUnary(
    unaryOperator: FLUnaryOperator,
    token: OperandToken,
  ): OperandToken {
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
  function parseFnArgs(): FLCompiled[] {
    tokenizer.next(); // consume open paren
    if (tokenizer.finished()) throw new SyntaxError(`Unterminated paren`);
    const args: FLCompiled[] = [];
    let closed = false;
    if (isCloseParen(tokenizer.lookahead())) {
      tokenizer.next();
      closed = true;
    } else {
      while (!tokenizer.finished()) {
        args.push(parseOperand().v);
        if (tokenizer.finished()) break;
        const nextToken = tokenizer.next();
        if (isComma(nextToken)) continue;
        if (isCloseParen(nextToken)) closed = true;
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
function isCloseParen(token: Token | null): token is PunctuatorToken {
  return token?.t === TokenType.punctuator && token.v === ")";
}

/**
 * Checks whether the token is a comma.
 */
function isComma(token: Token): token is PunctuatorToken {
  return token.t === TokenType.punctuator && token.v === ",";
}
