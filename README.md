# formula-literal

Write formulas with template literals.

## 🚀 Features

- You can write formulas with template literals.\
  (`` f`0.3 - 0.1` `` is easier to read than a statement like `new Big(0.3).minus(0.1)`.)
- Returns exact calculation results using arbitrary-precision arithmetic with BigInt.\
  (Similar to [big.js].)
- The calculation engine is customizable.

## 💿 Installation

```bash
npm install formula-literal
```

## 📖 Usage

```js
import { setupEngine } from 'formula-literal';

const f = setupEngine();
const num = 10;
const result = f`1 + 2 * ${num}`;
console.log(result); // 21

// Perform exact calculations using the arbitrary-precision arithmetic with BigInt.
console.log(f`${0.2} + ${0.1}`); // 0.3
console.log(0.2 + 0.1); // 0.30000000000000004
```

## 🛸 Prior Art

- [bigjs-literal]\
This package is similar to [bigjs-literal] in that it uses template literals for calculations, but [bigjs-literal] has a 49kB file for the parser alone.\
The JavaScript file for the compiler that `formula-literal` has is 8kB. (However, there is no ability to compile it in advance.)

[big.js]: https://github.com/MikeMcl/big.js
[bigjs-literal]: https://www.npmjs.com/package/bigjs-literal
