# @bignum/template

Write formulas with template literals.

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

## 🛸 Prior Art

- [bigjs-literal]\
  This package is similar to [bigjs-literal] in that it uses template literals for calculations, but [bigjs-literal] has a 49kB file for the parser alone.\
  The JavaScript file for the compiler that `@bignum/template` has is 8kB (without minify). (However, there is no ability to compile it in advance.)

[big.js]: https://github.com/MikeMcl/big.js
[bigjs-literal]: https://www.npmjs.com/package/bigjs-literal
