import { declare } from "@babel/helper-plugin-utils";
import { addNamed } from "@babel/helper-module-imports";
import { compile } from "@bignum/template-compiler";
import { BigNum, toResult } from "@bignum/template/core";
import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

type Context = {
  get bigNumId(): t.Identifier;
  get toResultId(): t.Identifier;
};

export default declare(() => {
  return {
    name: "@bignum/babel-plugin",

    visitor: {
      Program(progPath) {
        let bigNumId: t.Identifier | null = null;
        let toResultId: t.Identifier | null = null;

        /**
         * Apply the macro to the tagged template expression.
         */
        function apply(reference: NodePath) {
          const { parentPath } = reference;
          if (!parentPath) return;
          if (parentPath.isTaggedTemplateExpression()) {
            parentPath.replaceWith(
              generateAST(parentPath.node, {
                get bigNumId() {
                  if (bigNumId) return bigNumId;
                  return (bigNumId = addNamed(
                    progPath,
                    "BigNum",
                    "@bignum/template/core",
                  ));
                },
                get toResultId() {
                  if (toResultId) return toResultId;
                  return (toResultId = addNamed(
                    progPath,
                    "toResult",
                    "@bignum/template/core",
                  ));
                },
              }),
            );
          }
        }

        progPath.traverse({
          ImportDeclaration(path) {
            if (path.node.source.value !== "@bignum/template") {
              return;
            }
            const removeSpecs = new Set<NodePath>();
            for (const spec of path.get("specifiers")) {
              const specNode = spec.node;
              if (specNode.type === "ImportDefaultSpecifier") {
                continue;
              } else if (specNode.type === "ImportSpecifier") {
                if (specNode.imported.type === "Identifier") {
                  if (specNode.imported.name === "f") {
                    path.scope.bindings[
                      specNode.local.name
                    ].referencePaths.forEach(apply);
                    removeSpecs.add(spec);
                  }
                }
              } else if (specNode.type === "ImportNamespaceSpecifier") {
                for (const p of path.scope.bindings[specNode.local.name]
                  .referencePaths) {
                  const parent = p.parentPath;
                  if (
                    parent?.isMemberExpression() &&
                    parent.get("property").isIdentifier({
                      name: "f",
                    })
                  ) {
                    apply(parent.parentPath);
                  }
                }
              }
            }
            if (removeSpecs.size === path.get("specifiers").length) {
              path.remove();
            } else {
              for (const spec of removeSpecs) {
                spec.remove();
              }
            }
          },
        });
      },
    },
  };
});

/**
 * Generate the AST for the tagged template expression.
 */
function generateAST(
  tagged: t.TaggedTemplateExpression,
  ctx: Context,
): t.Expression {
  const bigNumSet = new Set<t.Expression>();

  const template = tagged.quasi;
  const quasi = template.quasis.map((q) => q.value.raw);

  const compiler = compile(quasi);
  const exprs = template.expressions as t.Expression[];

  const result = compiler<string | t.Expression, t.Expression>(exprs, {
    binaryOperations: {
      "+": (a, b) => binExpr(a, "add", b),
      "-": (a, b) => binExpr(a, "subtract", b),
      "*": (a, b) => binExpr(a, "multiply", b),
      "/": (a, b) => binExpr(a, "divide", b),
      "%": (a, b) => binExpr(a, "modulo", b),
      "**": (a, b) => binExpr(a, "pow", b),
      "==": (a, b) => compare(a, "===", b),
      "!=": (a, b) => compare(a, "!==", b),
      "<=": (a, b) => compare(a, "<=", b),
      "<": (a, b) => compare(a, "<", b),
      ">=": (a, b) => compare(a, ">=", b),
      ">": (a, b) => compare(a, ">", b),
    },
    unaryOperations: {
      "-": (a) =>
        t.callExpression(
          t.memberExpression(bigNumOf(a), t.identifier("negate")),
          [],
        ),
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
        exprOf(t.memberExpression(t.identifier("Math"), t.identifier(k))),
      ]),
    ),
    functions: {
      sqrt: (a) => callExpr(a, "sqrt"),
      abs: (a) => callExpr(a, "abs"),
      trunc: (a) => callExpr(a, "trunc"),
      round: (a) => callExpr(a, "round"),
      floor: (a) => callExpr(a, "floor"),
      ceil: (a) => callExpr(a, "ceil"),
    },
  });

  return t.callExpression(ctx.toResultId, [exprOf(result)]);

  /**
   * Create a binary expression.
   */
  function binExpr(
    a: string | t.Expression,
    operator: keyof BigNum & string,
    b: string | t.Expression,
  ) {
    const bignum = t.callExpression(
      t.memberExpression(bigNumOf(a), t.identifier(operator)),
      [exprOf(b)],
    );
    bigNumSet.add(bignum);
    return bignum;
  }

  /**
   * Create a call expression.
   */
  function callExpr(a: string | t.Expression, method: keyof BigNum & string) {
    const bignum = t.callExpression(
      t.memberExpression(bigNumOf(a), t.identifier(method)),
      [],
    );
    bigNumSet.add(bignum);
    return bignum;
  }

  /**
   * Create a binary expression.
   */
  function compare(
    a: string | t.Expression,
    operator: "===" | "!==" | ">" | "<" | ">=" | "<=",
    b: string | t.Expression,
  ) {
    return t.binaryExpression(
      operator,
      t.callExpression(
        t.memberExpression(bigNumOf(a), t.identifier("compareTo")),
        [exprOf(b)],
      ),
      t.numericLiteral(0),
    );
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

  /**
   * Get the BigNum expression
   */
  function bigNumOf(value: string | t.Expression) {
    const expr = exprOf(value);
    if (bigNumSet.has(expr)) {
      return expr;
    }
    const bignum = t.callExpression(
      t.memberExpression(ctx.bigNumId, t.identifier("valueOf")),
      [expr],
    );
    bigNumSet.add(bignum);
    return bignum;
  }
}
