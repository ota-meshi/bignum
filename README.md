# formula-literal

Write formulas with template literals.

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
```

## 🚀 Features

- You can write formulas with template literals.
- The calculation engine is customizable.

## 🛸 Prior Art

- [bigjs-literal]\
This package is similar to [bigjs-literal] in that it uses template literals for calculations, but [bigjs-literal] has a 49kB file for the parser alone.\
The JavaScript file for the compiler that `formula-literal` has is 8kB.

[bigjs-literal]: https://www.npmjs.com/package/bigjs-literal
