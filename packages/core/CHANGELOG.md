# @bignum/core

## 0.10.0

### Minor Changes

- pref: improve performance toString() ([#43](https://github.com/ota-meshi/bignum/pull/43))

- feat: improve sqrt ([#43](https://github.com/ota-meshi/bignum/pull/43))

- pref: improve performance for pow ([#40](https://github.com/ota-meshi/bignum/pull/40))

## 0.9.0

### Minor Changes

- pref: improve performance ([#37](https://github.com/ota-meshi/bignum/pull/37))

### Patch Changes

- fix: divide-by-zero edge case. ([#35](https://github.com/ota-meshi/bignum/pull/35))

## 0.8.0

### Minor Changes

- feat!: Reimplement BigNum ([#34](https://github.com/ota-meshi/bignum/pull/34))

  The BigNum class has been completely rewritten to use rational numbers to hold numbers.\
  Therefore, calculations like `1 / 3 * 3` can return a complete number like `1`.

  Due to this change, the options for calculation have changed significantly and are no longer compatible with previous versions.

## 0.7.0

### Minor Changes

- feat: improve divide (take 2 ([#30](https://github.com/ota-meshi/bignum/pull/30))

- feat: add support non-integer nthRoot ([#26](https://github.com/ota-meshi/bignum/pull/26))

- feat!: change default divide option ([#30](https://github.com/ota-meshi/bignum/pull/30))

- feat: improved nthRoot ([#28](https://github.com/ota-meshi/bignum/pull/28))

- feat: improve divide ([#29](https://github.com/ota-meshi/bignum/pull/29))

- feat: improve divide (take 3 ([#31](https://github.com/ota-meshi/bignum/pull/31))

## 0.6.0

### Minor Changes

- feat: add support non-integer pow ([#24](https://github.com/ota-meshi/bignum/pull/24))

## 0.5.0

### Minor Changes

- feat: add support for nthRoot ([#23](https://github.com/ota-meshi/bignum/pull/23))

## 0.4.0

### Minor Changes

- feat: support for sqrt ([#18](https://github.com/ota-meshi/bignum/pull/18))

- feat!: redesign of divide options. ([#15](https://github.com/ota-meshi/bignum/pull/15))

## 0.3.0

### Minor Changes

- fix: support minus pows ([#13](https://github.com/ota-meshi/bignum/pull/13))

### Patch Changes

- fix: wrong isFinite() ([#13](https://github.com/ota-meshi/bignum/pull/13))

## 0.2.0

### Minor Changes

- feat: add support Infinity ([#11](https://github.com/ota-meshi/bignum/pull/11))

### Patch Changes

- fix: wrong divide ([#11](https://github.com/ota-meshi/bignum/pull/11))

## 0.1.1

### Patch Changes

- fix: wrong result of ceil/floor ([#9](https://github.com/ota-meshi/bignum/pull/9))

## 0.1.0

### Minor Changes

- Implemented `@bignum/*` ([#1](https://github.com/ota-meshi/bignum/pull/1))
