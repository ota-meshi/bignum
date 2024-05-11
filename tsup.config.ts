import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entryPoints: ["src/index.mts"],
  format: ["cjs", "esm"],
  outDir: "lib",
  target: "node14",
});
