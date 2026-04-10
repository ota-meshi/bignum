import assert from "node:assert";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isNodeVersionSupported } from "../compat/engine-utils.mts";
import { installSupportedCompatPackages } from "../compat/install-supported.mts";
import { TEMP_ROOT, setupTempRoot } from "../shared.mjs";
import bignum from "../../src/index.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const COMPAT_ROOT = path.resolve(__dirname, "../compat");
const VITE_COMPAT_CASES = loadViteCompatCases();

describe("@bignum/vite-plugin", () => {
  setupTempRoot();

  describe("Vite compatibility", () => {
    before(() => {
      installSupportedCompatPackages();
    });

    for (const compatCase of VITE_COMPAT_CASES) {
      const testCase = isNodeVersionSupported(compatCase.nodeRange)
        ? it
        : it.skip;
      testCase(`builds with ${compatCase.label}`, async () => {
        const output = await buildWithVite(
          compatCase.packageDir,
          compatCase.label,
          `
            import { f } from "@bignum/template";

            export default f\`1 + 2 * 3\`;
          `,
        );

        assert.match(output, /@bignum\/template\/core/u);
        assert.doesNotMatch(output, /from "@bignum\/template";/u);
      });
    }
  });
});

async function buildWithVite(
  packageDir: string,
  label: string,
  code: string,
): Promise<string> {
  const compatRequire = createRequire(path.join(packageDir, "package.json"));
  const vitePath = compatRequire.resolve("vite");
  const viteModule = (await import(pathToFileURL(vitePath).href)) as {
    build?: (config: Record<string, unknown>) => Promise<unknown>;
    default?: { build?: (config: Record<string, unknown>) => Promise<unknown> };
  };
  const build = viteModule.build ?? viteModule.default?.build;
  assert.ok(build, `Unable to load Vite build() from ${label}`);

  const dir = fs.mkdtempSync(
    path.join(TEMP_ROOT, `${path.basename(packageDir)}-`),
  );
  const entryPath = path.join(dir, "entry.mjs");
  fs.writeFileSync(entryPath, code, "utf8");

  try {
    const result = await build({
      build: {
        lib: {
          entry: entryPath,
          fileName: () => "bundle.js",
          formats: ["es"],
        },
        minify: false,
        outDir: path.join(dir, "dist"),
        rollupOptions: {
          external: [/^@bignum\//u],
        },
        write: false,
      },
      configFile: false,
      logLevel: "silent",
      plugins: [bignum()],
      publicDir: false,
      root: dir,
    });

    const output = collectBuildOutput(result);
    assert.ok(output, `No output generated for ${label}`);
    return output;
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
}

function collectBuildOutput(result: unknown): string {
  const entries = Array.isArray(result) ? result : [result];
  return entries
    .flatMap((entry) => {
      if (
        !entry ||
        typeof entry !== "object" ||
        !("output" in entry) ||
        !Array.isArray(entry.output)
      ) {
        return [];
      }
      return entry.output;
    })
    .flatMap((chunk) => {
      if (!chunk || typeof chunk !== "object" || !("code" in chunk)) {
        return [];
      }
      return typeof chunk.code === "string" ? [chunk.code] : [];
    })
    .join("\n");
}

function loadViteCompatCases() {
  return fs
    .readdirSync(COMPAT_ROOT, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => {
      const packageDir = path.join(COMPAT_ROOT, dirent.name);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(packageDir, "package.json"), "utf8"),
      ) as {
        dependencies?: Record<string, string>;
        engines?: { node?: string };
      };

      const versionRange = packageJson.dependencies?.vite ?? "";
      const major = /\d+/u.exec(versionRange)?.[0] ?? "?";

      return {
        label: `Vite ${major}`,
        packageDir,
        nodeRange: packageJson.engines?.node ?? "",
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}
