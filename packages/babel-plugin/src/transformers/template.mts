import type { NodePath } from "@babel/core";
import { addNamed } from "@babel/helper-module-imports";
import { compile } from "@bignum/template-compiler";
import * as t from "@babel/types";
import type * as coreAll from "@bignum/template/core";
import { BigNum, toResult } from "@bignum/template/core";

type CoreMethod = keyof typeof coreAll;

export class TemplateContext {
  private readonly idMap = new Map<string, t.Identifier>();

  private readonly progPath: NodePath<t.Program>;

  constructor(progPath: NodePath<t.Program>) {
    this.progPath = progPath;
  }

  public getId(name: CoreMethod): t.Identifier {
    if (this.idMap.has(name)) return this.idMap.get(name)!;
    const id = addNamed(this.progPath, name, "@bignum/template/core");
    this.idMap.set(name, id);
    return id;
  }
}

/**
 * Transforms tagged template literals.
 */
export function transformTemplate(
  tagged: NodePath<t.TaggedTemplateExpression>,
  ctx: TemplateContext,
): t.Expression {
  const valuesSet = new Set<t.Expression>();

  const template = tagged.node.quasi;
  const quasi = template.quasis.map((q) => q.value.raw);

  const compiler = compile(quasi);
  const exprs = template.expressions as t.Expression[];

  const resultValue = compiler<string | t.Expression, t.Expression>(exprs, {
    binaryOperations: {
      "+": (a, b) => binCallExpr("add", a, b),
      "-": (a, b) => binCallExpr("subtract", a, b),
      "*": (a, b) => binCallExpr("multiply", a, b),
      "/": (a, b) => binCallExpr("divide", a, b),
      "%": (a, b) => binCallExpr("modulo", a, b),
      "**": (a, b) => binCallExpr("pow", a, b),
      "==": (a, b) => binCallExpr("equal", a, b),
      "!=": (a, b) => binCallExpr("notEqual", a, b),
      "<=": (a, b) => binCallExpr("lte", a, b),
      "<": (a, b) => binCallExpr("lt", a, b),
      ">=": (a, b) => binCallExpr("gte", a, b),
      ">": (a, b) => binCallExpr("gt", a, b),
    },
    unaryOperations: {
      "-": (a) => callExpr("negate", a),
      "+": (a) => exprOf(a),
    },
    variables: Object.fromEntries(
      (
        [
          "E",
          "LN10",
          "LN2",
          "LOG2E",
          "LOG10E",
          "PI",
          "SQRT1_2",
          "SQRT2",
        ] as const
      ).map((k) => [
        k,
        t.memberExpression(t.identifier("Math"), t.identifier(k)),
      ]),
    ),
    functions: {
      sqrt: (a) => callExpr("sqrt", a),
      abs: (a) => callExpr("abs", a),
      trunc: (a) => callExpr("trunc", a),
      round: (a) => callExpr("round", a),
      floor: (a) => callExpr("floor", a),
      ceil: (a) => callExpr("ceil", a),
    },
  });

  return t.callExpression(ctx.getId("toResult"), [exprOf(resultValue)]);

  /**
   * Create a call expression with two arguments.
   */
  function binCallExpr(
    operator: CoreMethod,
    a: string | t.Expression,
    b: string | t.Expression,
  ) {
    const result = t.callExpression(ctx.getId(operator), [
      exprOf(a),
      exprOf(b),
    ]);
    valuesSet.add(result);
    return result;
  }

  /**
   * Create a call expression.
   */
  function callExpr(method: CoreMethod, a: string | t.Expression) {
    const result = t.callExpression(ctx.getId(method), [exprOf(a)]);
    valuesSet.add(result);
    return result;
  }

  /**
   * Get the expression
   */
  function exprOf(value: string | t.Expression) {
    if (typeof value === "string") {
      const bignum = new BigNum(value);
      const res = toResult(bignum);
      if (typeof res === "number" && Number.isSafeInteger(res)) {
        return t.numericLiteral(res);
      }
      return t.stringLiteral(value);
    }
    return value;
  }
}
