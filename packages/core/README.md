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

If `divider` is give a zero value, an error will be raised.

An object can be given as an option.

Options:

| Name  | Type   | Default | Description                           |
| :---- | :----- | :------ | :------------------------------------ |
| maxDp | bigint | `20n`   | The maximum number of decimal places. |

### BigNum.prototype.modulo(divisor): BigNum

Returns a BigNum whose value is (this % divisor).

### BigNum.prototype.negate(): BigNum

Returns a BigNum whose value is (-this).

### BigNum.prototype.pow(n): BigNum

Returns a BigNum whose value is (this \*\* n).

If `n` is given a non-integer value, an error will be raised.

### BigNum.prototype.scaleByPowerOfTen(n): BigNum

Returns a BigNum whose value is (this \* 10 \*\* n).

If `n` is given a non-integer value, an error will be raised.

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

Returns true if this is NaN.

## 🛸 Prior Art

- [big.js]
- [bignumber.js]
- [decimal.js]

[big.js]: https://github.com/MikeMcl/big.js
[bignumber.js]: https://github.com/MikeMcl/bignumber.js
[decimal.js]: https://github.com/MikeMcl/decimal.js
