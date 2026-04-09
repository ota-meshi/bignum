---
"@bignum/core": major
---

Change `BigNum#toString()` so non-terminating decimals now return up to 20 digits after the decimal point regardless of the integer-part length.

This is a breaking change because repeating-decimal string output for values such as `3 / 2.25` and `12345678901234567891 / 3` now includes more fractional digits than in previous releases.
