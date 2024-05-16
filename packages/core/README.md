# @bignum/core

Arbitrary-precision decimal arithmetic with BigInt.

## 💿 Installation

```bash
npm install @bignum/core
```

## 📖 Usage

```js
import { BigNum } from "@bignum/core";

// Perform exact calculations using the arbitrary-precision arithmetic with BigInt.
console.log(BigNum.valueOf(0.2).add(BigNum.valueOf(0.1)).toString()); // 0.3
console.log(0.2 + 0.1); // 0.30000000000000004
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

### BigNum.prototype.divide(divisor, [options]): BigNum

Returns a BigNum whose value is (this / divisor).

An object can be given as an option.

Options:

| Name                    | Type                 | Description                                                                                                                      |
| :---------------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| overflow                | `(context)=>boolean` | You can specify an overflow test function. By default, if the number of decimal places exceeds 20, it is considered an overflow. |
| ~~maxDp~~               | bigint               | **Deprecated**. The maximum number of decimal places.                                                                            |
| ~~maxDecimalPrecision~~ | bigint               | **Deprecated**. The maximum number of precision when having decimals.                                                            |

- `context` parameter

  An object that contains the following properties:

  | Name      | Type   | Description                   |
  | :-------- | :----- | :---------------------------- |
  | scale     | bigint | The number of decimal places. |
  | precision | bigint | The number of precision.      |

### BigNum.prototype.modulo(divisor): BigNum

Returns a BigNum whose value is (this % divisor).

### BigNum.prototype.negate(): BigNum

Returns a BigNum whose value is (-this).

### BigNum.prototype.pow(n, [options]): BigNum

Returns a BigNum whose value is (this \*\* n).

If `n` is given a non-integer value, an error will be raised.

An object can be given as an option. It's the same option for `divide()`. This is used in negative pows.

Options:

| Name                    | Type                 | Description                                                                                                                                         |
| :---------------------- | :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| overflow                | `(context)=>boolean` | You can specify an overflow test function. By default, if there are decimals and the number of precisions exceeds 20, it is considered an overflow. |
| ~~maxDp~~               | bigint               | **Deprecated**. The maximum number of decimal places.                                                                                               |
| ~~maxDecimalPrecision~~ | bigint               | **Deprecated**. The maximum number of precision when having decimals.                                                                               |

- `context` parameter

  An object that contains the following properties:

  | Name      | Type   | Description                   |
  | :-------- | :----- | :---------------------------- |
  | scale     | bigint | The number of decimal places. |
  | precision | bigint | The number of precision.      |

### BigNum.prototype.scaleByPowerOfTen(n): BigNum

Returns a BigNum whose value is (this \* 10 \*\* n).

If `n` is given a non-integer value, an error will be raised.

### BigNum.prototype.sqrt([options]): BigNum

Returns an approximation to the square root of this BigNum.

If this BigNum is a negative value, an error will be raised.

An object can be given as an option. It's the same option for `divide()`.

### BigNum.prototype.nthRoot(n, [options]): BigNum

Returns an approximation to the `n`th root of this BigNum.

If this BigNum or `n` are negative value, an error will be raised.\
If `n` is given a non-integer value, an error will be raised.

An object can be given as an option. It's the same option for `divide()`.

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

## 🛸 Prior Art

- [big.js]
- [bignumber.js]
- [decimal.js]

[big.js]: https://github.com/MikeMcl/big.js
[bignumber.js]: https://github.com/MikeMcl/bignumber.js
[decimal.js]: https://github.com/MikeMcl/decimal.js
