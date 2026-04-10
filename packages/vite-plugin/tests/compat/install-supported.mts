import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isNodeVersionSupported } from "./engine-utils.mts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const compatRoot = path.resolve(__dirname);

export function installSupportedCompatPackages(): void {
  for (const dirent of fs.readdirSync(compatRoot, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const packageDir = path.join(compatRoot, dirent.name);
    const packageJsonPath = path.join(packageDir, "package.json");
    if (!fs.existsSync(packageJsonPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
      engines?: { node?: string };
    };
    const nodeRange = pkg.engines?.node;
    if (!nodeRange || !isNodeVersionSupported(nodeRange)) {
      // Skip packages that target a newer Node release than the current runtime.
      continue;
    }

    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    const installArgs = fs.existsSync(
      path.join(packageDir, "package-lock.json"),
    )
      ? ["ci", "--ignore-scripts"]
      : ["install", "--ignore-scripts"];
    const result = spawnSync(npmCommand, installArgs, {
      cwd: packageDir,
      stdio: "inherit",
    });
    if (result.status !== 0) {
      throw new Error(
        `Failed to install compatibility dependencies in ${packageDir}`,
      );
    }
  }
}
