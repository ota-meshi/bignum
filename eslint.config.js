import plugin from "@ota-meshi/eslint-plugin";
import eslintPluginMath from "eslint-plugin-math";
import tseslint from "typescript-eslint";
export default [
  ...plugin.config({
    node: true,
    ts: true,
    json: true,
    packageJson: true,
    prettier: true,
  }),
  eslintPluginMath.configs.recommended,
  {
    files: ["*.ts", "**/*.ts", "*.mts", "**/*.mts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.base.json",
      },
    },
    rules: {
      "no-shadow": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-member-accessibility": "off",
      complexity: "off",
      "no-loop-func": "off",
      "func-style": "off",
      "no-constant-condition": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/no-this-alias": "off",
      "one-var": "off",
      "no-param-reassign": "off",
      "no-process-env": "off",
      "@typescript-eslint/naming-convention": "off",
    },
  },
  {
    files: [
      "**/scripts/**/*.ts",
      "**/scripts/**/*.mts",
      "**/tests/**/*.ts",
      "**/tests/**/*.mts",
      "packages/test/**/*.mts",
    ],
    rules: {
      "jsdoc/require-jsdoc": "off",
      "@typescript-eslint/no-shadow": "off",
      "no-console": "off",
    },
  },
  {
    ignores: [
      ".nyc_output/",
      "lib/",
      "node_modules/",
      "!.vscode/",
      "packages/*/lib/",
      "packages/*/temp/",
      "packages/*/coverage/",
    ],
  },
];
