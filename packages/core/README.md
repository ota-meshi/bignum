# @bignum/core

Arbitrary-precision decimal arithmetic with BigInt.

[![NPM license](https://img.shields.io/npm/l/@bignum/core.svg)](https://www.npmjs.com/package/@bignum/core)
[![NPM version](https://img.shields.io/npm/v/@bignum/core.svg)](https://www.npmjs.com/package/@bignum/core)
[![NPM downloads](https://img.shields.io/badge/dynamic/json.svg?label=downloads&colorB=green&suffix=/day&query=$.downloads&uri=https://api.npmjs.org//downloads/point/last-day/@bignum/core&maxAge=3600)](http://www.npmtrends.com/@bignum/core)
[![NPM downloads](https://img.shields.io/npm/dw/@bignum/core.svg)](http://www.npmtrends.com/@bignum/core)
[![NPM downloads](https://img.shields.io/npm/dm/@bignum/core.svg)](http://www.npmtrends.com/@bignum/core)
[![NPM downloads](https://img.shields.io/npm/dy/@bignum/core.svg)](http://www.npmtrends.com/@bignum/core)
[![NPM downloads](https://img.shields.io/npm/dt/@bignum/core.svg)](http://www.npmtrends.com/@bignum/core)

## 🚀 Features

- Class for arbitrary-precision decimal arithmetic using BigInt.
- It can handle very large and very small numbers.
- It can also handle NaN and Infinity.
- <span class="minified-size"> 7.8 KB <!-- 7992 bytes --> minified ([bignumber.js]: 17.9 KB) </span>.
- <span class="minified-and-gzipped-size"> 3.3 KB minified and gzipped ([bignumber.js]: 8.0 KB) </span>.

## 💿 Installation

```bash
npm install @bignum/core
```

## 📖 Usage

```js
import { BigNum } from "@bignum/core";

// Perform exact calculations using arbitrary-precision arithmetic with BigInt.
console.log(BigNum.valueOf(0.2).add(BigNum.valueOf(0.1)).toString()); // 0.3
// (Using the JavaScript built-in number:)
console.log(0.2 + 0.1); // 0.30000000000000004

// Can handle very large numbers.
console.log(BigNum.valueOf(1.7976931348623157e308).add(12345).toString()); // 17976931348623157000...(Repeat `0` 281 times)...00012345
// Can handle very small numbers.
console.log(BigNum.valueOf(5e-324).subtract(12345).toString()); // -12344.999...(Repeat `9` 317 times)...9995

// Since the value is held as a rational number, no rounding errors occur due to division.
console.log(BigNum.valueOf(1).divide(3).multiply(3).toString()); // 1
// `toString()` gives the standard string form of the current value.
const oneThird = BigNum.valueOf(1).divide(3);
console.log(oneThird.toString()); // 0.33333333333333333333
// If you need a finite decimal value at a specific scale, materialize that value first.
console.log(oneThird.trunc(25).toString()); // 0.3333333333333333333333333
console.log(oneThird.round(2).toString()); // 0.33
```

For finite decimals, `toString()` preserves the exact value. For non-terminating decimals such as `1 / 3`, `toString()` returns the library's default compact decimal form for the current exact value. If you need a finite decimal value at a specific scale, use `trunc(dp)`, `round(dp)`, `floor(dp)`, or `ceil(dp)` first, then stringify that new value.

## 🧮 API

### new BigNum(value)

Translates a value into a BigNum.\
Numbers with decimals are first converted to strings and processed.\
Note that numbers that have already lost precision are not handled well.

### BigNum.valueOf(value): BigNum

Translates a value into a BigNum.\
Same as constructor, but if given a BigNum instance, that instance is returned.

### BigNum.parse(string, radix): BigNum

Converts a string to a BigNum.

### BigNum.prototype.add(augend): BigNum

Returns a BigNum whose value is (this + augend).

### BigNum.prototype.subtract(subtrahend): BigNum

Returns a BigNum whose value is (this - subtrahend).

### BigNum.prototype.multiply(multiplicand): BigNum

Returns a BigNum whose value is (this \* multiplicand).

### BigNum.prototype.divide(divisor): BigNum

Returns a BigNum whose value is (this / divisor).

### BigNum.prototype.modulo(divisor): BigNum

Returns a BigNum whose value is (this % divisor).

### BigNum.prototype.negate(): BigNum

Returns a BigNum whose value is (-this).

### BigNum.prototype.pow(n, [options: MathOptions]): BigNum

Returns a BigNum whose value is (this \*\* n).

An object can be given as an option. This is used for negative or fractional powers. See [MathOptions](#type-mathoptions).

### BigNum.prototype.scaleByPowerOfTen(n): BigNum

Returns a BigNum whose value is (this \* 10 \*\* n).

### BigNum.prototype.sqrt([options: MathOptions]): BigNum

Returns an approximation to the square root of this BigNum.

An object can be given as an option. See [MathOptions](#type-mathoptions).

If this BigNum is a negative number, returns a BigNum instance indicating `NaN`.

Note that `x.nthRoot(2)` and `x.sqrt()` behave differently.\
`x.nthRoot(2)` imitates `x ** (1/2)`, while `x.sqrt()` imitates `Math.sqrt(x)`.

### BigNum.prototype.nthRoot(n, [options: MathOptions]): BigNum

Returns an approximation to the `n`th root of this BigNum.

An object can be given as an option. See [MathOptions](#type-mathoptions).

If this BigNum is a negative finite number, returns a BigNum instance indicating `NaN`.

Note that `x.nthRoot(2)` and `x.sqrt()` behave differently.\
`x.nthRoot(2)` imitates `x ** (1/2)`, while `x.sqrt()` imitates `Math.sqrt(x)`.

### BigNum.prototype.abs(): BigNum

Returns a BigNum whose value is the absolute value of this BigNum.

### BigNum.prototype.trunc([dp]): BigNum

Returns a BigNum that is the integral part of this BigNum, with any fractional digits removed.

If `dp` is given, truncates to that many decimal places instead. Negative `dp` values round on the integer side of the decimal point.

### BigNum.prototype.round([dp]): BigNum

Returns this BigNum rounded to the nearest integer.

If `dp` is given, rounds to that many decimal places instead. Negative `dp` values round on the integer side of the decimal point.

### BigNum.prototype.floor([dp]): BigNum

Returns the greatest integer less than or equal to this BigNum.

If `dp` is given, floors to that many decimal places instead. Negative `dp` values round on the integer side of the decimal point.

### BigNum.prototype.ceil([dp]): BigNum

Returns the smallest integer greater than or equal to this BigNum.

If `dp` is given, ceils to that many decimal places instead. Negative `dp` values round on the integer side of the decimal point.

### BigNum.prototype.signum(): 0 | 1 | -1 | NaN

Returns a number indicating the sign.

### BigNum.prototype.compareTo(value): 0 | -1 | 1 | NaN

Compares this BigNum with the specified value.

### BigNum.prototype.isNaN(): boolean

Returns `true` if this is NaN.

### BigNum.prototype.isFinite(): boolean

Returns `true` if this is a finite number.

### type MathOptions

Options:

| Name         | Type                               | Description                                                                                        |
| :----------- | :--------------------------------- | :------------------------------------------------------------------------------------------------- |
| overflow     | `(context) => boolean`             | Overflow test function. By default, decimal results overflow when the precision exceeds 20 digits. |
| roundingMode | [RoundingMode](#enum-roundingmode) | Rounding behavior for operations that may discard precision. The default is `RoundingMode.trunc`.  |

- `context` parameter

  An object that contains the following properties:

  | Name      | Type   | Description                       |
  | :-------- | :----- | :-------------------------------- |
  | scale     | bigint | The number of decimal places.     |
  | precision | bigint | The number of significant digits. |

### enum RoundingMode

The following enumerated values are available:

- `RoundingMode.trunc`
- `RoundingMode.round`
- `RoundingMode.floor`
- `RoundingMode.ceil`

## 🚀 Advanced Usage

### BigNumBasic

```js
import { BigNumBasic } from "@bignum/core";
```

If you want something smaller, use BigNumBasic.

It omits the advanced APIs from `BigNum` (`parse`, `pow`, `scaleByPowerOfTen`, `sqrt`, and `nthRoot`), and can be reduced to just <span class="bignum-basic-size"> 4.3 KB <!-- 4443 bytes --> with tree shaking and minification (minified and gzipped: 1.8 KB) </span>.\
However, the API it provides is still experimental.

## 🛸 Prior Art

- [big.js]
- [bignumber.js]
- [decimal.js]

[big.js]: https://github.com/MikeMcl/big.js
[bignumber.js]: https://github.com/MikeMcl/bignumber.js
[decimal.js]: https://github.com/MikeMcl/decimal.js
