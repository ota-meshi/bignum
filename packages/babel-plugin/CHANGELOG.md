# @bignum/babel-plugin

## 3.0.0

### Major Changes

- Drop Node.js 18 support. The minimum supported Node.js version is now 20. ([#149](https://github.com/ota-meshi/bignum/pull/149))

### Patch Changes

- fix: keep non-canonical integer-like literals as strings in the Babel plugin ([#154](https://github.com/ota-meshi/bignum/pull/154))

  Update `@bignum/babel-plugin` so integer-like literals such as `1.0` and `1e2` remain strings unless they can be emitted as the same canonical integer literal without changing their source representation.

- Updated dependencies [[`ddef043`](https://github.com/ota-meshi/bignum/commit/ddef043ca4101a9ed541845ff883543ab55ce6f5)]:
  - @bignum/template@2.0.0
  - @bignum/template-compiler@2.0.0

## 2.1.1

### Patch Changes

- Updated dependencies [[`c1aefdead0b31cc74da02251d7b766ad7289573e`](https://github.com/ota-meshi/bignum/commit/c1aefdead0b31cc74da02251d7b766ad7289573e), [`1e1f48683fd29f2a7d38c769d9df2b64d39bcb19`](https://github.com/ota-meshi/bignum/commit/1e1f48683fd29f2a7d38c769d9df2b64d39bcb19)]:
  - @bignum/template@1.2.0

## 2.1.0

### Minor Changes

- feat: Improved babel-plugin to optimize output ([#95](https://github.com/ota-meshi/bignum/pull/95))

## 2.0.0

### Minor Changes

- feat: add support for `@bignum/template-light` to babel plugin ([#90](https://github.com/ota-meshi/bignum/pull/90))

- feat: Improved babel-plugin to optimize output ([#85](https://github.com/ota-meshi/bignum/pull/85))

- feat: Improved babel-plugin to optimize output ([#87](https://github.com/ota-meshi/bignum/pull/87))

### Patch Changes

- fix: bug for import all ([#88](https://github.com/ota-meshi/bignum/pull/88))

- Updated dependencies [[`6dd5299f20b28a8b3064698bbd0d2127180278a7`](https://github.com/ota-meshi/bignum/commit/6dd5299f20b28a8b3064698bbd0d2127180278a7)]:
  - @bignum/template@1.1.0

## 1.0.1

### Patch Changes

- Updated dependencies [[`398c80f1224f122de10afbaa134dfb3703e3ab0d`](https://github.com/ota-meshi/bignum/commit/398c80f1224f122de10afbaa134dfb3703e3ab0d)]:
  - @bignum/template@1.0.0
  - @bignum/template-compiler@1.0.0

## 1.0.0

### Minor Changes

- feat: add babel-plugin ([#81](https://github.com/ota-meshi/bignum/pull/81))

### Patch Changes

- Updated dependencies [[`5198b677ad5b26a93f90ba332a95f9a6b857f189`](https://github.com/ota-meshi/bignum/commit/5198b677ad5b26a93f90ba332a95f9a6b857f189)]:
  - @bignum/template@0.4.0
