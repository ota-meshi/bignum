# @bignum

Exact decimal arithmetic for JavaScript.

`@bignum` is a JavaScript library for exact decimal arithmetic.
The main package is `@bignum/core`, and optional add-ons provide formula syntax and build-time transforms when you want them.

## ❓ Why `@bignum`?

- Perform decimal arithmetic without the usual floating-point surprises.
- Handle very large and very small values.
- Work with `NaN` and `Infinity`.
- Add formula syntax and build-time compilation only if your project needs them.

## 🚀 Packages

- [@bignum/core](./packages/core/README.md)
  The main package. Exact decimal arithmetic with an object API.
- [@bignum/template](./packages/template/README.md)
  Optional tagged-template formula syntax built on top of `@bignum/core`.
- [@bignum/template-light](./packages/template-light/README.md)
  A smaller optional formula runtime for common frontend calculations.
- [@bignum/babel-plugin](./packages/babel-plugin/README.md)
  Optional build-time compilation for template expressions.
- [@bignum/vite-plugin](./packages/vite-plugin/README.md)
  Optional Vite integration for the same compilation flow.

## 📖 Basic Examples

### Exact arithmetic with `@bignum/core`

```js
import { BigNum } from "@bignum/core";

console.log(BigNum.valueOf(0.2).add(0.1).toString()); // "0.3"
console.log(0.2 + 0.1); // 0.30000000000000004

const oneThird = BigNum.valueOf(1).divide(3);
console.log(oneThird.multiply(3).toString()); // "1"
console.log(oneThird.toString()); // "0.33333333333333333333"
console.log(oneThird.round(2).toString()); // "0.33"
```

### Optional formula syntax with `@bignum/template`

```js
import { f } from "@bignum/template";

// Mix JavaScript values and numeric literals in one formula
// without losing decimal precision.
const num = 0.1;
const result = f`${num} + 0.1 * 2`;
console.log(result); // 0.3
```
