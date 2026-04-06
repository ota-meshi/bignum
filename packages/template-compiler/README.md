# @bignum/template-compiler

Low-level compiler for calculation template literals.

## 💿 Installation

```bash
npm install @bignum/template-compiler
```

## 📖 Usage

```js
import { compile } from "@bignum/template-compiler";

const compiled = compile(["", " + 2 * 3"]);
const context = {
  binaryOperations: {
    "+": (a, b) => Number(a) + Number(b),
    "*": (a, b) => Number(a) * Number(b),
  },
};

console.log(compiled([1], context)); // 7
```

## 🧮 API

### compile(templateElements)

Compiles the static string parts of a tagged template literal into an executable function.

The returned function accepts:

- `params`: the substitution values from the template literal.
- `context`: an object that defines the operators, variables, and functions used during evaluation.
