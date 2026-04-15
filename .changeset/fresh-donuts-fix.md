---
"@bignum/babel-plugin": patch
---

Fix Babel transforms for template functions so calls with multiple arguments, such as `round(1 / 3, 2)`, preserve every argument.
