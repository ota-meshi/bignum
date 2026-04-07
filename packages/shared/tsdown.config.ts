import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  experimentalDts: true,
  entry: ["src/index.mts"],
  fixedExtension: false,
  format: ["esm", "cjs"],
  outDir: "lib",
  target: "node20",
});
