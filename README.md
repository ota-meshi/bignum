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
