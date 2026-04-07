import type { Format } from "tsdown";
import { defineConfig } from "tsdown";

export default defineConfig([
  {
    clean: true,
    experimentalDts: true,
    entry: ["src/index.mts", "src/core.mts"],
    fixedExtension: false,
    format: ["esm", "cjs"],
    outDir: "lib",
    target: "node20",
  },
  ...Object.entries({
    "index.min": "src/index.mts",
    "core.min": "src/core.mts",
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
      minify: true,
    };
  }),
]);
