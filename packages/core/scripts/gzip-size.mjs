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
const bignumBasic = fs.readFileSync(
  path.join(__dirname, "../temp/bignum-basic.min.js"),
);

fs.writeFileSync(
  README_PATH,
  fs
    .readFileSync(README_PATH, "utf8")
    .replace(
      /<span class="minified-size">[\s\S]*?<\/span>/u,
      `<span class="minified-size"> ${displayFileSize(Buffer.byteLength(minified, "utf8"))} <!-- ${fileSize(Buffer.byteLength(minified, "utf8"))} --> minified ([bignumber.js]: ${displayFileSize(Buffer.byteLength(bignumber, "utf8"))}) </span>`,
    )
    .replace(
      /<span class="minified-and-gzipped-size">[\s\S]*?<\/span>/u,
      `<span class="minified-and-gzipped-size"> ${displayFileSize(gzipSizeSync(minified))} minified and gzipped ([bignumber.js]: ${displayFileSize(gzipSizeSync(bignumber))}) </span>`,
    )
    .replace(
      /<span class="bignum-basic-size">[\s\S]*?<\/span>/u,
      `<span class="bignum-basic-size"> ${displayFileSize(Buffer.byteLength(bignumBasic, "utf8"))} <!-- ${fileSize(Buffer.byteLength(bignumBasic, "utf8"))} --> with tree shaking and minification (minified and gzipped: ${displayFileSize(gzipSizeSync(bignumBasic))}) </span>`,
    ),
);

/**
 * Display file size.
 */
function displayFileSize(size) {
  return `${(size / 1024).toFixed(1)} KB`;
}

/**
 * File size.
 */
function fileSize(size) {
  return `${size} bytes`;
}
