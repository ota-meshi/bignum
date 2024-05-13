import { defineConfig } from "tsup";

export default defineConfig([
  {
    clean: true,
    dts: true,
    entryPoints: ["src/index.mts", "src/compiler.mts"],
    format: ["esm"],
    outDir: "lib",
    target: "node18",
  },
  {
    dts: true,
    entryPoints: ["src/index.mts"],
    format: ["cjs"],
    outDir: "lib",
    target: "node18",
  },
]);
