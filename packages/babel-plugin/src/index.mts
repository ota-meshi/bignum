import { declare } from "@babel/helper-plugin-utils";
import { addNamed } from "@babel/helper-module-imports";
import { compile } from "@bignum/template-compiler";
import { BigNum, toResult } from "@bignum/template/core";
import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import type * as coreAll from "@bignum/template/core";

type CoreMethod = keyof typeof coreAll;

type Context = {
  getId(name: CoreMethod): t.Identifier;
};

export default declare(() => {
  return {
    name: "@bignum/babel-plugin",

    visitor: {
      Program(progPath) {
        const idMap = new Map<string, t.Identifier>();

        /**
         * Get the identifier for the name.
         */
        function getId(name: CoreMethod) {
          if (idMap.has(name)) return idMap.get(name)!;
          const id = addNamed(progPath, name, "@bignum/template/core");
          idMap.set(name, id);
          return id;
        }

        /**
         * Apply the macro to the tagged template expression.
         */
        function apply(reference: NodePath) {
          const { parentPath } = reference;
          if (!parentPath) return;
          if (parentPath.isTaggedTemplateExpression()) {
            parentPath.replaceWith(
              generateAST(parentPath.node, {
                getId,
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
  const valuesSet = new Set<t.Expression>();

  const template = tagged.quasi;
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
