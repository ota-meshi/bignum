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

## 🛸 Prior Art

- [big.js]

[big.js]: https://github.com/MikeMcl/big.js
