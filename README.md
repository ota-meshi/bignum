# @bignum

A various JavaScript utility library for performing arbitrary-precision arithmetics.

## 🚀 Packages

- [@bignum/core](./packages/core)
  - Arbitrary-precision decimal arithmetic with BigInt.
- [@bignum/template](./packages/template)
  - Write formulas with template literals.

## 📖 Basic Examples

```js
import { BigNum } from "@bignum/core";

// Perform exact calculations using the arbitrary-precision arithmetic with BigInt.
console.log(BigNum.valueOf(0.2).add(BigNum.valueOf(0.1)).toString()); // 0.3
console.log(0.2 + 0.1); // 0.30000000000000004
```

```js
import { setupEngine } from "@bignum/template";

const f = setupEngine();
const num = 0.1;
const result = f`${num} + 0.1 * 2`;
console.log(result); // 0.3
```
