import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.mts"],
  fixedExtension: false,
  format: ["esm", "cjs"],
  outDir: "lib",
  target: "node20",
});
