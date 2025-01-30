// eslint-disable-next-line n/no-extraneous-import -- ignore
import { gzipSizeSync } from "gzip-size";
import fs from "fs";
import path from "path";

const __dirname = new URL(".", import.meta.url).pathname;

const README_PATH = path.join(__dirname, "../README.md");

const minified = fs.readFileSync(path.join(__dirname, "../temp/index.min.js"));

fs.writeFileSync(
  README_PATH,
  fs
    .readFileSync(README_PATH, "utf8")
    .replace(
      /<span class="minified-size">[\s\S]*?<\/span>/u,
      `<span class="minified-size"> ${displayFileSize(Buffer.byteLength(minified, "utf8"))} (Minified and gzipped: ${displayFileSize(gzipSizeSync(minified, "utf8"))}) </span>`,
    ),
);

/**
 * Display file size.
 */
function displayFileSize(size) {
  return `${(size / 1024).toFixed(1)} KB`;
}
