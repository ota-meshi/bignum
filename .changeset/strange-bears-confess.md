---
"@bignum/core": minor
---

feat!: Reimplement BigNum

The BigNum class has been completely rewritten to use rational numbers to hold numbers.\
Therefore, calculations like `1 / 3 * 3` can return a complete number like `1`.

Due to this change, the options for calculation have changed significantly and are no longer compatible with previous versions.
