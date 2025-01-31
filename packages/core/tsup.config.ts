import type { Format } from "tsup";
import { defineConfig } from "tsup";

export default defineConfig([
  {
    clean: true,
    dts: true,
    entry: ["src/index.mts"],
    format: ["esm", "cjs"],
    outDir: "lib",
    target: "node18",
  },
  ...Object.entries({
    "index.min": "src/index.mts",
    "bignumber.min": "tests/bignumber.mts",
    "bignum-basic.min": "src/bignum-basic.mts",
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
  ...Object.entries({
    "bignum-basic": "src/bignum-basic.mts",
  }).map(([key, value]) => {
    return {
      clean: true,
      entry: {
        [key]: value,
      },
      format: ["esm" as Format],
      outDir: "temp",
      target: "node18" as const,
    };
  }),
]);
