// import { gzipSizeSync } from "gzip-size";
import fs from "fs";
import { createRequire } from "module";
import path from "path";

const __dirname = new URL(".", import.meta.url).pathname;

const README_PATH = path.join(__dirname, "../README.md");

const compiler = fs.readFileSync(
  path.join(__dirname, "../temp/template-compiler.js"),
);

const bigjsLiteralParser = fs.readFileSync(
  createRequire(import.meta.url).resolve("bigjs-literal/src/parser"),
);
fs.writeFileSync(
  README_PATH,
  fs
    .readFileSync(README_PATH, "utf8")
    .replace(
      /<span class="template-compiler-size">[\s\S]*?<\/span>/u,
      `<span class="template-compiler-size"> ${displayFileSize(Buffer.byteLength(compiler, "utf8"))} <!-- ${fileSize(Buffer.byteLength(compiler, "utf8"))} --> (without minify) </span>`,
    )
    .replace(
      /<span class="bigjs-literal-parser-size">[\s\S]*?<\/span>/u,
      `<span class="bigjs-literal-parser-size"> ${displayFileSize(Buffer.byteLength(bigjsLiteralParser, "utf8"))} <!-- ${fileSize(Buffer.byteLength(bigjsLiteralParser, "utf8"))} --> </span>`,
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
