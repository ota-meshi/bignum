import type { NodePath } from "@babel/core";
import { addNamed } from "@babel/helper-module-imports";
import { compile } from "@bignum/template-compiler";
import * as t from "@babel/types";
import type * as coreAll from "@bignum/template-light/core";

type CoreMethod = keyof typeof coreAll;

export class TemplateLightContext {
  private readonly idMap = new Map<string, t.Identifier>();

  private readonly progPath: NodePath<t.Program>;

  constructor(progPath: NodePath<t.Program>) {
    this.progPath = progPath;
  }

  public getId(name: CoreMethod): t.Identifier {
    if (this.idMap.has(name)) return this.idMap.get(name)!;
    const id = addNamed(this.progPath, name, "@bignum/template-light/core");
    this.idMap.set(name, id);
    return id;
  }
}

/**
 * Transforms tagged template literals.
 */
export function transformTemplateLight(
  tagged: NodePath<t.TaggedTemplateExpression>,
  ctx: TemplateLightContext,
): t.Expression {
  const valuesSet = new Set<t.Expression>();

  const template = tagged.node.quasi;
  const quasi = template.quasis.map((q) => q.value.raw);

  const compiler = compile(quasi);
  const exprs = template.expressions as t.Expression[];

  const args = tagged.scope.generateUidIdentifier("args");

  const resultValue = compiler<string | t.Expression, t.Expression>(exprs, {
    binaryOperations: {
      "+": (a, b) => binCallExpr("add", a, b),
      "-": (a, b) => binCallExpr("sub", a, b),
      "*": (a, b) => binCallExpr("mul", a, b),
      "/": (a, b) => binCallExpr("div", a, b),
      "%": (a, b) => binCallExpr("mod", a, b),
    },
  });

  return t.callExpression(ctx.getId("execCompiled"), [
    t.arrayExpression(exprs),
    t.arrowFunctionExpression([args], exprOf(resultValue)),
  ]);

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
   * Get the expression
   */
  function exprOf(value: string | t.Expression) {
    if (typeof value === "string") {
      throw new Error(
        `The operand must be an embedded expression. \nunexpected token: ${value}\ntemplate: ${tagged.getSource()}`,
      );
    }
    const exprIndex = exprs.indexOf(value);
    if (exprIndex >= 0) {
      return t.memberExpression(args, t.numericLiteral(exprIndex), true);
    }
    return value;
  }
}
