# @bignum/template-light

Write formulas with template literals. (**light version**)

This is the light version of [@bignum/template]. It has significantly more limited functionality than [@bignum/template], but is much smaller.

[@bignum/template]: ../template/README.md

[![NPM license](https://img.shields.io/npm/l/@bignum/template-light.svg)](https://www.npmjs.com/package/@bignum/template-light)
[![NPM version](https://img.shields.io/npm/v/@bignum/template-light.svg)](https://www.npmjs.com/package/@bignum/template-light)
[![NPM downloads](https://img.shields.io/badge/dynamic/json.svg?label=downloads&colorB=green&suffix=/day&query=$.downloads&uri=https://api.npmjs.org//downloads/point/last-day/@bignum/template-light&maxAge=3600)](http://www.npmtrends.com/@bignum/template-light)
[![NPM downloads](https://img.shields.io/npm/dw/@bignum/template-light.svg)](http://www.npmtrends.com/@bignum/template-light)
[![NPM downloads](https://img.shields.io/npm/dm/@bignum/template-light.svg)](http://www.npmtrends.com/@bignum/template-light)
[![NPM downloads](https://img.shields.io/npm/dy/@bignum/template-light.svg)](http://www.npmtrends.com/@bignum/template-light)
[![NPM downloads](https://img.shields.io/npm/dt/@bignum/template-light.svg)](http://www.npmtrends.com/@bignum/template-light)

## 🚀 Features

- You can write formulas with template literals.\
  (`` f`${0.3} - ${0.1}` `` is easier to read than a statement like `new MyNum(0.3).minus(0.1)`.)
- Prevent rounding errors by calculating with rational numbers using BigInt.
- There are no dependencies and can be minified to <span class="minified-size"> 2.3 KB (Minified and gzipped: 1.1 KB) </span>.

> Note that although no rounding is performed during calculations, the calculation results are returned to `Number`, so values that cannot be held by `Number` may be rounded.
>
> If you want more operations and more rounding avoidance, consider using [@bignum/template].

## 💿 Installation

```bash
npm install @bignum/template-light
```

## 📖 Usage

```js
import { f } from "@bignum/template-light";

const result = f`${0.1} + ${0.1} * ${2}`;
console.log(result); // 0.3

// Prevent rounding errors by calculating with rational numbers using BigInt.
console.log(f`${0.2} + ${0.1}`); // 0.3
console.log(0.2 + 0.1); // 0.30000000000000004
```

## 🧮 API

### f

Perform calculations using template literals.

Example:

```js
import { f } from "@bignum/template-light";

console.log(f`${0.1} + ${0.2}`); // 0.3
```

## 📝 Supported Syntax

### Operators

The following operators are supported:

```js
/* Arithmetic Operators */
// add
f`${0.1} + ${0.2}`; // 0.3
// subtract
f`${0.3} - ${0.1}`; // 0.2
// multiply
f`${0.07} * ${100}`; // 7
// divide
f`${0.6} / ${0.2}`; // 3
// modulo
f`${0.6} % ${0.2}`; // 0

/* Parentheses */
f`(${0.1} + ${0.2}) * ${10}`; // 3
f`${0.1} + ${0.2} * ${10}`; // 2.1
```

### Operand

Substitutions in the template literal are considered operands.

```js
f`${0.2} + ${0.1}`; // 0.3
```
