import { declare } from "@babel/helper-plugin-utils";
import type { NodePath } from "@babel/traverse";
import {
  TemplateContext,
  transformTemplate,
} from "./transformers/template.mts";
import {
  TemplateLightContext,
  transformTemplateLight,
} from "./transformers/template-light.mts";

export default declare(() => {
  return {
    name: "@bignum/babel-plugin",

    visitor: {
      Program(progPath) {
        const templateContext = new TemplateContext(progPath);
        const templateLightContext = new TemplateLightContext(progPath);

        /**
         * Apply the macro to the tagged template expression.
         */
        function apply(
          reference: NodePath,
          kind: "template" | "template-light",
        ) {
          const { parentPath } = reference;
          if (!parentPath) return;
          if (parentPath.isTaggedTemplateExpression()) {
            parentPath.replaceWith(
              kind === "template"
                ? transformTemplate(parentPath, templateContext)
                : transformTemplateLight(parentPath, templateLightContext),
            );
          }
        }

        progPath.traverse({
          ImportDeclaration(path) {
            const kind =
              path.node.source.value === "@bignum/template"
                ? "template"
                : path.node.source.value === "@bignum/template-light"
                  ? "template-light"
                  : null;
            if (!kind) {
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
                    for (const ref of path.scope.bindings[specNode.local.name]
                      .referencePaths) {
                      apply(ref, kind);
                    }
                    removeSpecs.add(spec);
                  }
                }
              } else if (specNode.type === "ImportNamespaceSpecifier") {
                const unremovedPaths = path.scope.bindings[
                  specNode.local.name
                ].referencePaths.filter((ref) => {
                  const parent = ref.parentPath;
                  if (
                    parent?.isMemberExpression() &&
                    parent.get("property").isIdentifier({
                      name: "f",
                    })
                  ) {
                    apply(parent, kind);
                    return false; // removed path
                  }
                  return true;
                });
                if (unremovedPaths.length === 0) {
                  removeSpecs.add(spec);
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
