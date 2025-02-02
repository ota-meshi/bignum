import { f } from "@bignum/template-light";

export default function test() {
  return [
    f`${0.2} + ${0.1}`, // 0.3
  ];
}
