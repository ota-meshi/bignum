import assert from "node:assert";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sourcePlugin from "../../src/index.mts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES_ROOT = path.resolve(__dirname, "./fixtures");
const BABEL_8_ROOT = path.resolve(__dirname, "../compat/babel8");

interface BabelCore {
  transformSync: (
    code: string,
    options: { plugins: unknown[] },
  ) => { code?: string | null } | null;
}

describe("@bignum/babel-plugin Babel 8 compatibility", () => {
  const testCase = supportsBabel8() ? it : it.skip;

  testCase("transforms fixtures with every public entry point", async () => {
    installBabel8();

    const compatRequire = createRequire(
      path.join(BABEL_8_ROOT, "package.json"),
    );
    const babelPath = compatRequire.resolve("@babel/core");
    const babel = (await import(
      pathToFileURL(babelPath).href
    )) as unknown as BabelCore;

    for (const { code, expected } of loadFixtures()) {
      const output = babel.transformSync(code, {
        plugins: [sourcePlugin],
      });
      assert.strictEqual(output?.code, expected);
    }

    const [{ default: esmPlugin }, cjsPlugin] = await Promise.all([
      import(new URL("../../lib/index.js", import.meta.url).href),
      Promise.resolve(createRequire(import.meta.url)("../../lib/index.cjs")),
    ]);
    const [{ code, expected }] = loadFixtures();
    for (const [entry, plugin] of [
      ["ESM", esmPlugin],
      ["CommonJS", cjsPlugin],
    ] as const) {
      const output = babel.transformSync(code, { plugins: [plugin] });
      assert.strictEqual(output?.code, expected, `${entry} entry point`);
    }
  });
});

/** Install the Babel 8 dependency isolated from the Node 20 workspace. */
function installBabel8(): void {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmCommand, ["ci", "--ignore-scripts"], {
    cwd: BABEL_8_ROOT,
    stdio: "inherit",
  });
  assert.strictEqual(result.status, 0, "Failed to install Babel 8");
}

/** Load every transformation fixture and its expected Babel output. */
function loadFixtures(): { code: string; expected: string }[] {
  const fixtures = [];
  for (const dirent of fs.readdirSync(FIXTURES_ROOT, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!dirent.isFile()) continue;
    const fileName = path.join(dirent.parentPath, dirent.name);
    if (!fileName.endsWith("input.mjs") && !fileName.endsWith("input.cjs")) {
      continue;
    }
    const inputPath = path.resolve(FIXTURES_ROOT, fileName);
    const outputPath = inputPath.replace(/input\.(mjs|cjs)$/u, "output.$1");
    fixtures.push({
      code: fs.readFileSync(inputPath, "utf8"),
      expected: fs.readFileSync(outputPath, "utf8"),
    });
  }
  return fixtures;
}

/** Check the Node ranges supported by Babel 8. */
function supportsBabel8(): boolean {
  const version = process.versions.node.split(".").map(Number);
  return (
    (version[0] === 22 && compareVersion(version, [22, 18, 0]) >= 0) ||
    compareVersion(version, [24, 11, 0]) >= 0
  );
}

/** Compare two semantic version tuples. */
function compareVersion(left: number[], right: number[]): number {
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}
