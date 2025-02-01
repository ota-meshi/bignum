import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { transform } from "@babel/core";
import plugin from "../../src/index.mts";
import assert from "assert";

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
      });
    }
  }
});
