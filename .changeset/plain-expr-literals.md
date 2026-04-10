---
"@bignum/babel-plugin": patch
---

fix: keep non-canonical integer-like literals as strings in the Babel plugin

Update `@bignum/babel-plugin` so integer-like literals such as `1.0` and `1e2` remain strings unless they can be emitted as the same canonical integer literal without changing their source representation.
