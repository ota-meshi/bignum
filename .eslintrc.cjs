// const version = require("./package.json").version

module.exports = {
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
  extends: [
    "plugin:@ota-meshi/recommended",
    "plugin:@ota-meshi/+node",
    "plugin:@ota-meshi/+typescript",
    "plugin:@ota-meshi/+package-json",
    "plugin:@ota-meshi/+prettier",
    "plugin:@ota-meshi/+json",
  ],
  overrides: [
    {
      files: ["*.ts", "*.mts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        sourceType: "module",
        project: "./tsconfig.base.json",
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
      },
    },
    {
      files: [
        "**/scripts/**/*.ts",
        "**/scripts/**/*.mts",
        "**/tests/**/*.ts",
        "**/tests/**/*.mts",
      ],
      rules: {
        "require-jsdoc": "off",
        "no-console": "off",
      },
    },
  ],
};
