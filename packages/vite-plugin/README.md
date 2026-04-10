# @bignum/vite-plugin

Vite plugin that pre-compiles tagged template literals for `@bignum/template` and `@bignum/template-light`.

[![NPM license](https://img.shields.io/npm/l/@bignum/vite-plugin.svg)](https://www.npmjs.com/package/@bignum/vite-plugin)
[![NPM version](https://img.shields.io/npm/v/@bignum/vite-plugin.svg)](https://www.npmjs.com/package/@bignum/vite-plugin)

## Features

- Pre-compiles tagged template literals written with `@bignum/template`.`f`.
- Pre-compiles tagged template literals written with `@bignum/template-light`.`f`.
- Works in Vite without adding a separate Babel config file.
- Supports normal script files and Vite virtual script modules such as `?vue&type=script&lang.ts`.

## Installation

```bash
npm install -D @bignum/vite-plugin
npm install @bignum/template
# or
npm install @bignum/template-light
```

## Usage

```ts
import { defineConfig } from "vite";
import bignum from "@bignum/vite-plugin";

export default defineConfig({
  plugins: [bignum()],
});
```

Then write formulas with tagged templates as usual.

```ts
import { f } from "@bignum/template";

const price = 0.1;
const total = f`${price} + 0.2`;
```

This is transformed to code that directly imports the compiled operations from `@bignum/template/core`.

## Options

`bignum({ babel })`

Pass additional Babel `parserOpts`, `generatorOpts`, or other non-plugin transform options through `babel`.
The plugin always disables project Babel config lookup and always injects `@bignum/babel-plugin`.
