import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "@babel/core";
import plugin from "../../src/index.mts";
import assert from "node:assert";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES_ROOT = path.resolve(__dirname, "./fixtures");

describe("@bignum/babel-plugin", () => {
  for (const dirent of fs.readdirSync(FIXTURES_ROOT, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!dirent.isFile()) continue;
    const fileName = path.join(dirent.parentPath, dirent.name);
    if (fileName.endsWith("input.mjs") || fileName.endsWith("input.cjs")) {
      it(`should match snapshot of ${fileName}`, () => {
        const inputPath = path.resolve(FIXTURES_ROOT, fileName);
        const outputPath = inputPath.replace(/input\.(mjs|cjs)$/, "output.$1");
        const code = fs.readFileSync(
          path.resolve(FIXTURES_ROOT, fileName),
          "utf8",
        );
        const output = transform(code, {
          plugins: [plugin],
        });
        if (fs.existsSync(outputPath) && !process.argv.includes("--update")) {
          const expected = fs.readFileSync(outputPath, "utf8");
          assert.strictEqual(output?.code, expected);
        } else {
          fs.writeFileSync(outputPath, output?.code || "", "utf8");
        }
      });

      it(`should match input and output`, async () => {
        const inputPath = path.resolve(FIXTURES_ROOT, fileName);
        const outputPath = inputPath.replace(/input\.(mjs|cjs)$/, "output.$1");

        const expected = (await import(inputPath)).default();
        const output = (await import(outputPath)).default();
        assert.deepStrictEqual(output, expected);
        // console.log(fileName, expected);
      });
    }
  }

  describe("canonical integer literal emission", () => {
    for (const [literal, expected] of [
      ["1", "_toResult(1);"],
      ["1.0", '_toResult("1.0");'],
      [".0", '_toResult(".0");'],
      ["1e2", '_toResult("1e2");'],
      ["9007199254740991", "_toResult(9007199254740991);"],
      ["1.0000000000000001", '_toResult("1.0000000000000001");'],
      ["9007199254740991.1", '_toResult("9007199254740991.1");'],
      ["9007199254740992", '_toResult("9007199254740992");'],
    ]) {
      it(`should emit a canonical literal for ${literal}`, () => {
        const output = transform(
          `import { f } from "@bignum/template"; export default f\`${literal}\`;`,
          {
            plugins: [plugin],
          },
        );
        assert.match(
          output?.code ?? "",
          new RegExp(escapeRegex(expected), "u"),
        );
      });
    }
  });
});

function escapeRegex(value: string): string {
  return value.replaceAll(/[$()*+.?[\\\]^{|}]/gu, "\\$&");
}
