import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Format } from "tsdown";
import { defineConfig } from "tsdown";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  {
    clean: true,
    dts: true,
    entry: ["src/index.mts", "src/core.mts"],
    fixedExtension: false,
    format: ["esm", "cjs"],
    outDir: "lib",
    target: "node20",
  },
  ...Object.entries({
    "template-compiler": "../template-compiler/src/index.mts",
  }).map(([key, value]) => {
    return {
      clean: true,
      entry: {
        [key]: value,
      },
      fixedExtension: false,
      format: ["esm" as Format],
      outDir: "temp",
      target: "node20" as const,
      minify: Boolean(key.includes(".min")),
      alias: {
        "@bignum/shared": path.resolve(__dirname, "../shared/src/index.mts"),
      },
      deps: { alwaysBundle: ["@bignum/shared"] },
    };
  }),
]);
