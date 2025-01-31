import { BigNum as _BigNum, toResult as _toResult } from "@bignum/template/core";
const num = 0.1;
const result = _toResult(_BigNum.valueOf(num).add(_BigNum.valueOf("0.1").multiply(2)));
console.log(result); // 0.3
console.log(_toResult(_BigNum.valueOf(0.2).add(0.1))); // 0.3