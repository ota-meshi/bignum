# @bignum/template

Write formulas with template literals.

[![NPM license](https://img.shields.io/npm/l/@bignum/template.svg)](https://www.npmjs.com/package/@bignum/template)
[![NPM version](https://img.shields.io/npm/v/@bignum/template.svg)](https://www.npmjs.com/package/@bignum/template)
[![NPM downloads](https://img.shields.io/badge/dynamic/json.svg?label=downloads&colorB=green&suffix=/day&query=$.downloads&uri=https://api.npmjs.org//downloads/point/last-day/@bignum/template&maxAge=3600)](http://www.npmtrends.com/@bignum/template)
[![NPM downloads](https://img.shields.io/npm/dw/@bignum/template.svg)](http://www.npmtrends.com/@bignum/template)
[![NPM downloads](https://img.shields.io/npm/dm/@bignum/template.svg)](http://www.npmtrends.com/@bignum/template)
[![NPM downloads](https://img.shields.io/npm/dy/@bignum/template.svg)](http://www.npmtrends.com/@bignum/template)
[![NPM downloads](https://img.shields.io/npm/dt/@bignum/template.svg)](http://www.npmtrends.com/@bignum/template)

## 🚀 Features

- You can write formulas with template literals.\
  (`` f`0.3 - 0.1` `` is easier to read than a statement like `new Big(0.3).minus(0.1)`.)
- Returns exact calculation results using arbitrary-precision arithmetic with BigInt.\
  (Similar to [big.js].)
- The calculation engine is customizable.

## 💿 Installation

```bash
npm install @bignum/template
```

## 📖 Usage

```js
import { setupEngine } from "@bignum/template";

const f = setupEngine();
const num = 0.1;
const result = f`${num} + 0.1 * 2`;
console.log(result); // 0.3

// Perform exact calculations using the arbitrary-precision arithmetic with BigInt.
console.log(f`${0.2} + ${0.1}`); // 0.3
console.log(0.2 + 0.1); // 0.30000000000000004
```

## 🧮 API

### setupEngine([context]): BTEngine

Returns the calculation engine.

- `context`: An object for customizing calculations.\
  By default, calculations are performed using BigNum.

#### setupEngine context

TBA

### BTEngine

Perform calculations using template literals.

Example:

```js
import { setupEngine } from "@bignum/template";

const f = setupEngine();
console.log(f`${0.1} + 0.2`); // 0.3
```

The calculation result usually returns a `number`, but if the `number` loses precision when converted to a `string`, it returns a `string` with the original precision is returned.

## 📝 Supported Syntax

### Operators

The following operators are supported:

```js
/* Arithmetic Operators */
// add
f`0.1 + 0.2`; // 0.3
// subtract
f`0.3 - 0.1`; // 0.2
// multiply
f`0.1 * 10`; // 1
f`${0.000002} * ${10}` // 0.00002
// divide
f`0.6 / 0.2`; // 0.3
// modulo
f`0.6 % 0.2`; // 0
// pow / nth root
f`2 ** 3`; // 8
f`4 ** (1/2)`; // 2
f`8 ** (1/3)`; // 2

/* Parentheses */
f`(0.1 + 0.2) * 10`; // 3
f`0.1 + 0.2 * 10`; // 2.1

/* Unary Operators */
f`${0.3} + -${0.1}`; // 0.2

/* Logical Operators (Returns 0/1 for value compatibility) */
f`41 == 41`; // 1
f`41 == 1`; // 0
f`41 != 41`; // 0
f`41 != 1`; // 1
f`1 <= 2`; // 1
f`1 <= 1`; // 1
f`1 <= 0`; // 0
f`1 < 2`; // 1
f`1 < 1`; // 0
f`1 < 1`; // 0
f`2 >= 1`; // 1
f`1 >= 1`; // 1
f`0 >= 1`; // 0
f`2 > 1`; // 1
f`1 > 1`; // 0
f`0 > 1`; // 0
```

### Operand

Either write the numerical value as is in the template, or the template literal substitution is considered as an operand.

```js
f`0.3 + -${0.1}`; // 0.2
```

### Variables

Variables can be accessed using identifiers. The supported variables are:

```js
f`E`; // Same as Math.E
f`LN10`; // Same as Math.LN10
f`LN2`; // Same as Math.LN2
f`LOG2E`; // Same as Math.LOG2E
f`LOG10E`; // Same as Math.LOG10E
f`PI`; // Same as Math.PI
f`SQRT1_2`; // Same as Math.SQRT1_2
f`SQRT2`; // Same as Math.SQRT2
```

### Functions

You can call built-in functions by writing a Call expression.

```js
f`trunc(12.34)`; // Returns the value by truncating the given value.
f`round(12.34)`; // Returns the given value rounded to the nearest integer.
f`floor(12.34)`; // Returns the greatest integer less than or equal to the given value.
f`ceil(12.34)`; // Returns the smallest integer greater than or equal to the given value.
f`abs(-1)`; // Returns the absolute value.
f`sqrt(2)`; // Returns the square root of 2.
```

## 🛸 Prior Art

- [bigjs-literal]\
  This package is similar to [bigjs-literal] in that it uses template literals for calculations, but [bigjs-literal] has a 49kB file for the parser alone.\
  The JavaScript file for the compiler that `@bignum/template` has is 8kB (without minify). (However, there is no ability to compile it in advance.)

[big.js]: https://github.com/MikeMcl/big.js
[bigjs-literal]: https://www.npmjs.com/package/bigjs-literal
