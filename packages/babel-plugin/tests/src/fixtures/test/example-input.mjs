import { f } from "@bignum/template";

const num = 0.1;
const result = f`${num} + 0.1 * 2`;
console.log(result); // 0.3
console.log(f`${0.2} + ${0.1}`); // 0.3
