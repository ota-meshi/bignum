// eslint-disable-next-line n/no-extraneous-import -- ignore
import { gzipSizeSync } from "gzip-size";
import fs from "fs";
import path from "path";

const __dirname = new URL(".", import.meta.url).pathname;

const README_PATH = path.join(__dirname, "../README.md");

const minified = fs.readFileSync(path.join(__dirname, "../temp/index.min.js"));
const bignumber = fs.readFileSync(
  path.join(__dirname, "../temp/bignumber.min.js"),
);

fs.writeFileSync(
  README_PATH,
  fs
    .readFileSync(README_PATH, "utf8")
    .replace(
      /- [^\n]*(?:\n\s*)?minified\s*\([^\n]*/u,
      `- ${displayFileSize(Buffer.byteLength(minified, "utf8"))} minified ([bignumber.js]: ${displayFileSize(Buffer.byteLength(bignumber, "utf8"))}).`,
    )
    .replace(
      /- [^\n]*(?:\n\s*)?minified\s+and\s+gzipped\s*\([^\n]*/u,
      `- ${displayFileSize(gzipSizeSync(minified))} minified and gzipped ([bignumber.js]: ${displayFileSize(gzipSizeSync(bignumber))}).`,
    ),
);

/**
 * Display file size.
 */
function displayFileSize(size) {
  return `${(size / 1024).toFixed(1)} KB`;
}

// - 7.5 KB minified.
// - 3.2 KB minified and gzipped.
