import { multiply as _multiply, add as _add, toResult as _toResult } from "@bignum/template/core";
const num = 0.1;
const result = _toResult(_add(num, _multiply("0.1", 2)));
console.log(result); // 0.3
console.log(_toResult(_add(0.2, 0.1))); // 0.3