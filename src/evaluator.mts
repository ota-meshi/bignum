import type { FLFunction } from "./commons.mjs";
import {
  BINARY_OPERATORS,
  UNARY_OPERATORS,
  type FLContext,
  type FLBinaryOperator,
  type FLUnaryOperator,
} from "./commons.mjs";

const reId = /^[\p{ID_Start}$_][\p{ID_Continue}$\u200c\u200d]*$/u;
const enum TokenMode {
  element,
  operand,
  finished,
}
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
type OperandToken<T> = { t: TokenType.operand; v: T | string };
type IdentifierToken = { t: TokenType.identifier; v: string };
type Token<T> =
  | PunctuatorToken
  | OperatorToken
  | OperandToken<T>
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

class Tokenizer<OPERAND> {
  private readonly elements: ArrayLike<string>;

  private readonly operands: readonly OPERAND[];

  private mode = TokenMode.element;

  private index = 0;

  private curr: string;

  private position = 0;

  private readonly buffer: Token<OPERAND>[] = [];

  constructor(elements: ArrayLike<string>, operands: readonly OPERAND[]) {
    this.elements = elements;
    this.operands = operands;
    this.curr = this.elements[0];
    this.consume(0);
  }

  public finished(): boolean {
    return this.mode === TokenMode.finished && !this.buffer.length;
  }

  public next(): Token<OPERAND> {
    if (this.buffer.length) {
      return this.buffer.pop()!;
    }
    if (this.mode === TokenMode.element) {
      for (const token of WELLKNOWN_TOKEN) {
        if (this.eat(token.v)) {
          return token;
        }
      }

      // parse operand
      let value = this.curr[this.position++];
      while (this.position < this.curr.length) {
        if (this.isSpace()) break;
        for (const token of WELLKNOWN_TOKEN) {
          if (this.match(token.v)) {
            break;
          }
        }
        value += this.curr[this.position++];
      }
      this.consume(0);
      if (reId.test(value)) {
        return { t: TokenType.identifier, v: value };
      }
      return { t: TokenType.operand, v: value };
    }
    return this.consumeOperand();
  }

  public back(token: Token<OPERAND>) {
    this.buffer.push(token);
  }

  private match(str: string): boolean {
    return this.curr.startsWith(str, this.position);
  }

  private isSpace(): boolean {
    return !this.curr[this.position].trim();
  }

  private eat(str: string): boolean {
    if (!this.match(str)) {
      return false;
    }
    this.consume(str.length);
    return true;
  }

  private consume(offset: number) {
    this.position += offset;
    if (this.position < this.curr.length) {
      if (this.isSpace()) {
        // skip spaces
        this.consume(1);
      }
    } else {
      this.mode =
        this.operands.length <= this.index
          ? TokenMode.finished
          : TokenMode.operand;
    }
  }

  private consumeOperand(): OperandToken<OPERAND> {
    const value = this.operands[this.index++];
    this.mode = TokenMode.element;
    this.position = 0;
    this.curr = this.elements[this.index];
    this.consume(0);
    return { t: TokenType.operand, v: value };
  }
}

/**
 * Parse and evaluate a template string with operands.
 */
export function evaluate<OPERAND, RESULT, NORMALIZED>(
  templateElements: readonly string[],
  operands: readonly OPERAND[],
  context: FLContext<OPERAND, RESULT, NORMALIZED>,
): NORMALIZED {
  const tokenizer = new Tokenizer(templateElements, operands);
  const result = parseAndEvaluate(tokenizer, context);
  if (!tokenizer.finished()) throw new SyntaxError(`Parsing error`);
  return context.normalizeResult(result.v);
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
 * Parse and evaluate a template string with operands.
 */
function parseAndEvaluate<OPERAND, RESULT, NORMALIZED>(
  tokenizer: Tokenizer<OPERAND>,
  context: FLContext<OPERAND, RESULT, NORMALIZED>,
): OperandToken<OPERAND | RESULT> {
  const variables = context.variables ?? {};
  const functions = context.functions ?? {};

  return parseAndEvaluateInternal();

  /** Process for internal */
  function parseAndEvaluateInternal() {
    const stack: Token<OPERAND | RESULT>[] = [];
    let unaryOperator: FLUnaryOperator | null = null;

    while (!tokenizer.finished()) {
      const token = tokenizer.next();
      if (token.t === TokenType.punctuator) {
        if (token.v === ")") {
          tokenizer.back(token);
          break;
        }
        if (token.v !== "(") {
          throw new SyntaxError(`Unexpected '${token.v}'`);
        }
        const operand = parseAndEvaluateInternal();
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
        if (token.v in variables) {
          const value = variables[token.v];
          stack.push(
            processOperand(unaryOperator, { t: TokenType.operand, v: value }),
          );
          unaryOperator = null;
        } else if (functions[token.v]) {
          const fn = functions[token.v];
          stack.push(processOperand(unaryOperator, parseFunctionAndCall(fn)));
          unaryOperator = null;
        } else {
          throw new SyntaxError(`Unknown identifier '${token.v}'`);
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
    token: OperandToken<OPERAND | RESULT>,
  ): OperandToken<OPERAND | RESULT> {
    if (unaryOperator) {
      const unaryOperation = context.unaryOperations[unaryOperator];
      if (!unaryOperation)
        throw new SyntaxError(`Unsupported unary operator '${unaryOperator}'`);
      token.v = unaryOperation(token.v);
      return token;
    }
    return token;
  }

  /**
   * Process for binary expression
   */
  function processBinary(
    stack: Token<OPERAND | RESULT>[],
  ): OperandToken<RESULT> {
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
    const binaryOperation = context.binaryOperations[op.v];
    if (!binaryOperation)
      throw new SyntaxError(`Unsupported binary operator '${op.v}'`);
    const result = binaryOperation(left.v, right.v);
    return {
      t: TokenType.operand,
      v: result,
    };
  }

  /**
   * Parse function and call
   */
  function parseFunctionAndCall(
    fn: FLFunction<OPERAND, RESULT>,
  ): OperandToken<RESULT> {
    if (tokenizer.finished()) throw new SyntaxError(`Unexpected end of input`);
    const firstToken = tokenizer.next();
    if (firstToken.t !== TokenType.punctuator || firstToken.v !== "(")
      throw new SyntaxError(`Expected '('`);

    const args: (OPERAND | RESULT | string)[] = [];
    let closed = false;
    const token = tokenizer.next();
    if (!isCloseParen(token)) {
      closed = true;
    } else {
      tokenizer.back(token);
      while (!tokenizer.finished()) {
        args.push(parseAndEvaluateInternal().v);
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
    const result = fn(...args);
    return {
      t: TokenType.operand,
      v: result,
    };
  }
}

/**
 * Checks whether the token is a close parenthesis.
 */
function isCloseParen<T>(token: Token<T>): token is PunctuatorToken {
  return token.t === TokenType.punctuator && token.v === ")";
}

/**
 * Checks whether the token is a comma.
 */
function isComma<T>(token: Token<T>): token is PunctuatorToken {
  return token.t === TokenType.punctuator && token.v === ",";
}
