import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.mts"],
  format: ["esm", "cjs"],
  outDir: "lib",
  target: "node18",
});
