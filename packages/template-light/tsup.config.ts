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
  {
    clean: true,
    entry: {
      "index.min": "src/index.mts",
    },
    format: ["esm"],
    outDir: "temp",
    target: "node18",
    minify: true,
  },
]);
