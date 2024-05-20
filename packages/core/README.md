# @bignum/core

Arbitrary-precision decimal arithmetic with BigInt.

## 🚀 Features

- Class for arbitrary-precision arithmetics using BigInt.
- It can handle very large and very small numbers.

## 💿 Installation

```bash
npm install @bignum/core
```

## 📖 Usage

```js
import { BigNum } from "@bignum/core";

// Perform exact calculations using the arbitrary-precision arithmetic with BigInt.
console.log(BigNum.valueOf(0.2).add(BigNum.valueOf(0.1)).toString()); // 0.3
// (Using the JavaScript built-in number:)
console.log(0.2 + 0.1); // 0.30000000000000004

// Can handle very large numbers.
console.log(BigNum.valueOf(1.7976931348623157e308).add(12345).toString()); // 17976931348623157000...(Repeat `0` 281 times)...00012345
// Can handle very small numbers.
console.log(BigNum.valueOf(5e-324).subtract(12345).toString()); // -12344.999...(Repeat `9` 317 times)...9995

// Since the value is held as a rational number, no rounding errors occur due to division.
console.log(BigNum.valueOf(1).divide(3).multiply(3).toString()); // 1
// (However, if you convert an infinite decimal value into a string, a rounding error will occur.)
console.log(BigNum.valueOf(1).divide(3).toString()); // 0.33333333333333333333
```

## 🧮 API

### new BigNum(value)

Translates a value into a BigNum.\
Numbers with decimals are first converted to strings and processed.\
Note that numbers that have already lost precision are not handled well.

### BigNum.valueOf(value): BigNum

Translates a value into a BigNum.\
Same as constructor, but if given a BigNum instance, that instance is returned.

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

### BigNum.prototype.pow(n, [options: MathOption]): BigNum

Returns a BigNum whose value is (this \*\* n).

An object can be given as an option. This is used in negative, or fraction pows. See [MathOption](#type-mathoption).

### BigNum.prototype.scaleByPowerOfTen(n): BigNum

Returns a BigNum whose value is (this \* 10 \*\* n).

### BigNum.prototype.sqrt([options: MathOption]): BigNum

Returns an approximation to the square root of this BigNum.

An object can be given as an option. See [MathOption](#type-mathoption).

If this BigNum is a negative number, returns a BigNum instance indicating `NaN`.

Note that `x.nthRoot(2)` and `x.sqrt()` behave differently.\
`x.nthRoot(2)` imitates `x ** (1/2)`, while `x.sqrt()` imitates `Math.sqrt(x)`.

### BigNum.prototype.nthRoot(n, [options: MathOption]): BigNum

Returns an approximation to the `n`th root of this BigNum.

An object can be given as an option. See [MathOption](#type-mathoption).

If this BigNum is a negative finite number, returns a BigNum instance indicating `NaN`.

Note that `x.nthRoot(2)` and `x.sqrt()` behave differently.\
`x.nthRoot(2)` imitates `x ** (1/2)`, while `x.sqrt()` imitates `Math.sqrt(x)`.

### BigNum.prototype.abs(): BigNum

Returns a BigNum whose value is the absolute value of this BigNum.

### BigNum.prototype.trunc(): BigNum

Returns a BigNum that is the integral part of this BigNum, with removing any fractional digits.

### BigNum.prototype.round(): BigNum

Returns this BigNum rounded to the nearest integer.

### BigNum.prototype.floor(): BigNum

Returns the greatest integer less than or equal to this BigNum.

### BigNum.prototype.ceil(): BigNum

Returns the smallest integer greater than or equal to this BigNum.

### BigNum.prototype.signum(): 0 | 1 | -1 | NaN

Returns a number indicating the sign.

### BigNum.prototype.compareTo(value): 0 | -1 | 1 | NaN

Compares this BigNum with the specified BigNum.

### BigNum.prototype.isNaN(): boolean

Returns `true` if this is NaN.

### BigNum.prototype.isFinite(): boolean

Returns `true` if this is finite number.

### type MathOption

Options:

| Name         | Type                                       | Description                                                                                                                                         |
| :----------- | :----------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| overflow     | `(context)=>boolean`                       | You can specify an overflow test function. By default, if there are decimals and the number of precisions exceeds 20, it is considered an overflow. |
| roundingMode | [RoundingMode](#enum-roundingmode)`.trunc` | Specifies a rounding behavior for numerical operations capable of discarding precision.                                                             |

- `context` parameter

  An object that contains the following properties:

  | Name      | Type   | Description                   |
  | :-------- | :----- | :---------------------------- |
  | scale     | bigint | The number of decimal places. |
  | precision | bigint | The number of precision.      |

### enum RoundingMode

The following enumerated values are available:

- `RoundingMode.trunc`
- `RoundingMode.round`
- `RoundingMode.floor`
- `RoundingMode.ceil`

## 🛸 Prior Art

- [big.js]
- [bignumber.js]
- [decimal.js]

[big.js]: https://github.com/MikeMcl/big.js
[bignumber.js]: https://github.com/MikeMcl/bignumber.js
[decimal.js]: https://github.com/MikeMcl/decimal.js
