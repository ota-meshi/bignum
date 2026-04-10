import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import bignum from "../src/index.mjs";
import type { BignumViteTransformResult } from "../src/index.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
export const TEMP_ROOT = path.resolve(__dirname, "./temp");

export function setupTempRoot(): void {
  before(() => {
    fs.mkdirSync(TEMP_ROOT, { recursive: true });
  });
}

export async function runTransform(
  code: string,
  id: string,
): Promise<BignumViteTransformResult | null> {
  const plugin = bignum();
  return plugin.transform(code, id);
}

export async function evaluate(
  code: string,
  fileName: string,
): Promise<unknown> {
  const dir = fs.mkdtempSync(path.join(TEMP_ROOT, "module-"));
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, code, "utf8");

  try {
    const href = `${pathToFileURL(filePath).href}?t=${Date.now()}`;
    return (await import(href)).default;
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
}
