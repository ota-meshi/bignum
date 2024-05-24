import {
  BINARY_OPERATORS,
  UNARY_OPERATORS,
  type BTCompiled,
  type BTBinaryOperator,
  type BTUnaryOperator,
  PRECEDENCE,
} from "@bignum/shared";

const enum TokenType {
  punctuator,
  operator,
  operand,
  identifier,
}
type Punctuator = "(" | ")" | ",";
type DefineToken<T extends TokenType, V> = V extends infer E extends any
  ? { t: T; v: E }
  : never;
type PunctuatorToken = DefineToken<TokenType.punctuator, Punctuator>;
type BinaryOperatorToken = DefineToken<TokenType.operator, BTBinaryOperator>;
type UnaryOperatorToken = DefineToken<TokenType.operator, BTUnaryOperator>;
type OperatorToken = BinaryOperatorToken | UnaryOperatorToken;
type OperandToken = DefineToken<TokenType.operand, BTCompiled>;
type IdentifierToken = DefineToken<TokenType.identifier, string>;
type Token = PunctuatorToken | OperatorToken | OperandToken | IdentifierToken;

const RE_SP = /\s+/u;
type TokenProcessor = {
  re: { lastIndex: number; exec(s: string): null | string[] };
  create: (v: string) => Token;
};

/** Token to TokenProcessor  */
function t2p(t: PunctuatorToken | OperatorToken): TokenProcessor {
  const match = [t.v];
  const re = {
    lastIndex: 0,
    exec: (s: string) => (s.startsWith(t.v, re.lastIndex) ? match : null),
  };
  return { re, create: () => t };
}

const TOKEN_PROC: TokenProcessor[] = [
  t2p({ t: TokenType.punctuator, v: "(" }),
  t2p({ t: TokenType.punctuator, v: ")" }),
  t2p({ t: TokenType.punctuator, v: "," }),
  ...[...BINARY_OPERATORS, ...UNARY_OPERATORS]
    .map(
      (v): OperatorToken => ({
        t: TokenType.operator,
        v,
      }),
    )
    .sort((a, b) => b.v.length - a.v.length)
    .map(t2p),
  {
    re: /(?:\.\d+|(?:0|[1-9]\d*)(?:\.\d+)?)(?:e[+-]?\d+)?/iuy,
    create: (v: string): OperandToken => ({ t: TokenType.operand, v: () => v }),
  },
  {
    re: /[\p{ID_Start}$_][\p{ID_Continue}$\u200c\u200d]*/uy,
    create: (v: string): IdentifierToken => ({ t: TokenType.identifier, v }),
  },
];

type Tokenizer = {
  finished: () => boolean | undefined;
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
function buildTokenizer(elements: readonly string[]): Tokenizer {
  const buffer: Token[] = [];
  const tokens = splitTokens(elements)[Symbol.iterator]();
  let item = tokens.next();

  /** Get next token and consume */
  function next(): Token {
    if (buffer.length) return buffer.shift()!;
    const token = (item as IteratorYieldResult<Token>).value;
    item = tokens.next();
    return token;
  }

  /** Lookahead token */
  function lookahead(): Token | null {
    if (buffer.length) return buffer[0];
    if (item.done) return null;
    const nextToken = next();
    buffer.unshift(nextToken);
    return nextToken;
  }

  return {
    finished: () => item.done && !buffer.length,
    next,
    lookahead,
  };
}

/**
 * Template elements to tokens
 */
function* splitTokens(elements: readonly string[]): Iterable<Token> {
  for (const [index, element] of elements.entries()) {
    yield* element.split(RE_SP).flatMap((word) => wordTokens(word));
    if (elements.length > index + 1)
      yield {
        t: TokenType.operand,
        v: (params) => params[index],
      };
  }
}

/**
 * Word to tokens
 */
function wordTokens(word: string, position = 0): Token[] {
  if (word.length <= position) return [];
  for (const { re, create } of TOKEN_PROC) {
    re.lastIndex = position;
    const token = re.exec(word)?.[0];
    if (token) {
      return [create(token), ...wordTokens(word, position + token.length)];
    }
  }
  throw new SyntaxError(`Unexpected token`);
}

/**
 * Parse and evaluate a template string with operands.
 */
export function compile(templateElements: readonly string[]): BTCompiled {
  const tokenizer = buildTokenizer(templateElements);
  const result = parse(tokenizer);
  if (!tokenizer.finished()) throw new SyntaxError(`Parsing error`);
  return result;
}

/**
 * Parse a template string.
 */
function parse(tokenizer: Tokenizer): BTCompiled {
  return parseOperand().v;

  /** Parse for operand */
  function parseOperand(): OperandToken {
    const stack: (OperandToken | BinaryOperatorToken)[] = [];

    let processOperand = identity;

    while (!tokenizer.finished()) {
      const token = tokenizer.lookahead();
      if (!token || isCloseParen(token) || isComma(token)) break;
      tokenizer.next();
      if (token.t === TokenType.punctuator) {
        // if (token.v !== "(") throw new SyntaxError(`Unexpected '${token.v}'`);
        const operand = parseOperand();
        if (tokenizer.finished() || !isCloseParen(tokenizer.next()))
          throw new SyntaxError(`Unterminated paren`);
        stack.push(processOperand(operand));
      } else if (token.t === TokenType.operator) {
        if (!stack.length || stack.at(-1)!.t === TokenType.operator) {
          if (!UNARY_OPERATORS.has(token.v as BTUnaryOperator))
            // It is not Unary operator
            throw new SyntaxError(`Unexpected '${token.v}'`);
          const next = tokenizer.lookahead();
          if (next?.t === TokenType.operator)
            // Unary operator that was not consumed.
            throw new SyntaxError(`Unexpected '${token.v}'`);
          // It is Unary operator
          const unaryOperator = token.v as BTUnaryOperator;
          processOperand = (t) => {
            processOperand = identity;
            return processUnary(unaryOperator, t);
          };
        } else {
          if (stack.length >= 3) {
            const beforeOpToken = stack[stack.length - 2];
            if (
              beforeOpToken.t === TokenType.operator &&
              PRECEDENCE[token.v][1] <= PRECEDENCE[beforeOpToken.v][0]
            )
              stack.push(processBinary(stack));
          }
          stack.push(token as BinaryOperatorToken);
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
                if (!context?.variables || !(token.v in context.variables)) {
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
                if (!context?.functions || !(token.v in context.functions)) {
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
    if (result?.t !== TokenType.operand)
      throw new SyntaxError("Expected expression");
    return result;
  }

  /**
   * Process for unary expression
   */
  function processUnary(
    unaryOperator: BTUnaryOperator,
    token: OperandToken,
  ): OperandToken {
    return {
      t: TokenType.operand,
      v: (params, context) => {
        const unaryOperation = context?.unaryOperations?.[unaryOperator];
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
  function processBinary(
    stack: (OperandToken | BinaryOperatorToken)[],
  ): OperandToken {
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
        const binaryOperation = context?.binaryOperations?.[op.v];
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
  function parseFnArgs(): BTCompiled[] {
    tokenizer.next(); // consume open paren
    if (tokenizer.finished()) throw new SyntaxError(`Unterminated paren`);
    const args: BTCompiled[] = [];
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
function isCloseParen(
  token: Token | null,
): token is PunctuatorToken & { v: ")" } {
  return token?.t === TokenType.punctuator && token.v === ")";
}

/**
 * Checks whether the token is a comma.
 */
function isComma(token: Token): token is PunctuatorToken & { v: "," } {
  return token.t === TokenType.punctuator && token.v === ",";
}
