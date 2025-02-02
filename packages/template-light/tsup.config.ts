import type { Format } from "tsup";
import { defineConfig } from "tsup";

export default defineConfig([
  {
    clean: true,
    dts: true,
    entry: ["src/index.mts", "src/core.mts"],
    format: ["esm", "cjs"],
    outDir: "lib",
    target: "node18",
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
      format: ["esm" as Format],
      outDir: "temp",
      target: "node18" as const,
      minify: true,
    };
  }),
]);
