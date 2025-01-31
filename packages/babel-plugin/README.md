# @bignum/babel-plugin

Babel plugin to replace tagged template literals with BigNum JS expressions.

[![NPM license](https://img.shields.io/npm/l/@bignum/babel-plugin.svg)](https://www.npmjs.com/package/@bignum/babel-plugin)
[![NPM version](https://img.shields.io/npm/v/@bignum/babel-plugin.svg)](https://www.npmjs.com/package/@bignum/babel-plugin)
[![NPM downloads](https://img.shields.io/badge/dynamic/json.svg?label=downloads&colorB=green&suffix=/day&query=$.downloads&uri=https://api.npmjs.org//downloads/point/last-day/@bignum/babel-plugin&maxAge=3600)](http://www.npmtrends.com/@bignum/babel-plugin)
[![NPM downloads](https://img.shields.io/npm/dw/@bignum/babel-plugin.svg)](http://www.npmtrends.com/@bignum/babel-plugin)
[![NPM downloads](https://img.shields.io/npm/dm/@bignum/babel-plugin.svg)](http://www.npmtrends.com/@bignum/babel-plugin)
[![NPM downloads](https://img.shields.io/npm/dy/@bignum/babel-plugin.svg)](http://www.npmtrends.com/@bignum/babel-plugin)
[![NPM downloads](https://img.shields.io/npm/dt/@bignum/babel-plugin.svg)](http://www.npmtrends.com/@bignum/babel-plugin)

## 🚀 Features

- This pre-compiles tagged template literals written with [@bignum/template].f`.

## 💿 Installation

```bash
npm install -D @bignum/babel-plugin
npm install @bignum/template
```

## 📖 Usage

### Configuration

Include `@bignum/babel-plugin` in your Babel configuration.

```json
{
  "plugins": ["@bignum/babel-plugin"]
}
```

### Writing Code

Use `@bignum/template`.`f` to write the calculation formula.

```js
import { f } from "@bignum/template";

const num = 0.1;
const result = f`${num} + 0.1 * 2`;
console.log(result); // 0.3
console.log(f`${0.2} + ${0.1}`); // 0.3
```

## 🛸 Prior Art

- [bigjs-literal]\
  This package is similar to [bigjs-literal] in that it uses template literals for calculations, but is more lightweight.

[bigjs-literal]: https://www.npmjs.com/package/bigjs-literal
[@bignum/template]: ../template/README.md
