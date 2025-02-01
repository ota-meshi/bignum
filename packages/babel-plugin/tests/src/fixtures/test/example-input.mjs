import { f } from "@bignum/template";

const num = 0.1;
const result = f`${num} + 0.1 * 2`;

export default function test() {
  return [
    result, // 0.3
    f`${0.2} + ${0.1}`, // 0.3
  ];
}
