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
- You can pre-compile expressions using [@bignum/babel-plugin].
- Repeated calls from the same tagged template callsite reuse the compiled expression at runtime.

## 💿 Installation

```bash
npm install @bignum/template
```

## 📖 Usage

```js
import { f } from "@bignum/template";

const num = 0.1;
const result = f`${num} + 0.1 * 2`;
console.log(result); // 0.3

// Perform exact calculations using arbitrary-precision arithmetic with BigInt.
console.log(f`${0.2} + ${0.1}`); // 0.3
console.log(0.2 + 0.1); // 0.30000000000000004
console.log(f`1 / 3`); // "0.33333333333333333333"
console.log(f`trunc(1 / 3, 25)`); // "0.3333333333333333333333333"
console.log(f`round(1 / 3, 2)`); // 0.33
```

## 🧮 API

### f: BTEngine

The standard calculation engine.

### setupEngine([context]): BTEngine

Returns the calculation engine.

- `context`: An object for customizing calculations.\
  By default, calculations are performed using BigNum.

#### setupEngine context

The `context` object can define:

- `binaryOperations`: handlers for binary operators such as `+`, `-`, `*`, `/`, `%`, `**`, `==`, `!=`, `<=`, `<`, `>=`, and `>`.
- `unaryOperations`: handlers for unary operators such as `+` and `-`.
- `variables`: identifier values that can be referenced from expressions. The default variables (`E`, `PI`, and so on) come from `Math`, so they are convenient aliases, not arbitrary-precision constants.
- `functions`: callable functions such as `sqrt(...)`.
- `normalizeResult`: a final conversion step for the computed result.

### BTEngine

Perform calculations using template literals.

Example:

```js
import { setupEngine } from "@bignum/template";

const f = setupEngine();
console.log(f`${0.1} + 0.2`); // 0.3
```

Repeated evaluation from the same tagged template callsite reuses the compiled expression. Different callsites are cached independently.

The default engine performs calculations as exact rational arithmetic. It usually returns a `number`, but if converting the result to `number` would lose precision, it returns a `string` instead.

For finite decimals, that string preserves the exact value. For non-terminating decimals, the internal calculation is still exact, and the default engine returns the standard compact decimal form of the current value. For example, `` f`1 / 3` `` returns `"0.33333333333333333333"`.

If you need a finite decimal value at a specific scale, change the value in the expression first. For example, `` f`trunc(1 / 3, 25)` `` returns `"0.3333333333333333333333333"`, and `` f`round(1 / 3, 2)` `` returns `0.33`. This is value conversion, not display-only formatting.

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
f`0.07 * 100`; // 7
// divide
f`0.6 / 0.2`; // 3
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
f`2 < 1`; // 0
f`1 < 1`; // 0
f`2 >= 1`; // 1
f`1 >= 1`; // 1
f`0 >= 1`; // 0
f`2 > 1`; // 1
f`1 > 1`; // 0
f`0 > 1`; // 0
```

### Operand

Either write a numeric literal directly in the template, or use a template literal substitution as an operand.

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

These default values come from JavaScript's `Math` object, so they inherit double-precision floating-point approximations. If you need stricter values for constants such as `PI`, provide custom `variables` via `setupEngine(...)`.

### Functions

You can call built-in functions by writing a call expression.

```js
f`trunc(12.34)`; // Returns the value by truncating the given value.
f`trunc(12.34, 1)`; // Truncates the value to 1 decimal place.
f`round(12.34)`; // Returns the given value rounded to the nearest integer.
f`round(1 / 3, 2)`; // Rounds the value to 2 decimal places.
f`floor(12.34)`; // Returns the greatest integer less than or equal to the given value.
f`floor(1234.56, -2)`; // Floors the value to the nearest 100.
f`ceil(12.34)`; // Returns the smallest integer greater than or equal to the given value.
f`abs(-1)`; // Returns the absolute value.
f`sqrt(2)`; // Returns the square root of 2.
```

## 🛸 Prior Art

- [bigjs-literal]\
  This package is similar to [bigjs-literal] in that it uses template literals for calculations, but [bigjs-literal] has a <span class="bigjs-literal-parser-size"> 48.3 KB <!-- 49484 bytes --> </span> file for the parser alone.\
  The JavaScript file for the compiler that `@bignum/template` has is <span class="template-compiler-size"> 7.6 KB <!-- 7755 bytes --> (without minify) </span>.

[@bignum/babel-plugin]: ../babel-plugin/README.md
[big.js]: https://github.com/MikeMcl/big.js
[bigjs-literal]: https://www.npmjs.com/package/bigjs-literal
