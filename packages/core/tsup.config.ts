import { defineConfig } from "tsup";

export default defineConfig([
  {
    clean: true,
    dts: true,
    entryPoints: ["src/index.mts"],
    format: ["esm", "cjs"],
    outDir: "lib",
    target: "node18",
  },
  // {
  //   entryPoints: {
  //     "index.min": "src/index.mts",
  //   },
  //   format: ["esm"],
  //   outDir: "lib",
  //   target: "node18",
  //   minify: true,
  // },
  // {
  //   entryPoints: ["src/bignum-mini.mts"],
  //   format: ["esm"],
  //   outDir: "lib",
  //   target: "node18",
  //   minify: true,
  // },
]);
