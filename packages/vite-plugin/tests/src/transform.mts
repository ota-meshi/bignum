import assert from "node:assert";
import { evaluate, runTransform, setupTempRoot } from "../shared.mjs";

describe("@bignum/vite-plugin", () => {
  setupTempRoot();

  it("transforms @bignum/template calls in ESM", async () => {
    const input = `
      import { f } from "@bignum/template";

      const value = 0.1;

      export default [
        f\`\${value} + 0.2\`,
        f\`1 + 2 * 3\`,
      ];
    `;

    const output = await runTransform(input, "/entry.mjs");
    assert.ok(output);
    assert.match(output.code, /@bignum\/template\/core/u);
    assert.doesNotMatch(output.code, /from "@bignum\/template"/u);

    const expected = await evaluate(input, "input.mjs");
    const actual = await evaluate(output.code, "output.mjs");
    assert.deepStrictEqual(actual, expected);
  });

  it("transforms namespace imports from @bignum/template-light", async () => {
    const input = `
      import * as bt from "@bignum/template-light";

      const left = 0.2;
      const right = 0.1;

      export default bt.f\`\${left} + \${right}\`;
    `;

    const output = await runTransform(input, "/entry.mjs");
    assert.ok(output);
    assert.match(output.code, /@bignum\/template-light\/core/u);
    assert.doesNotMatch(output.code, /from "@bignum\/template-light"/u);

    const expected = await evaluate(input, "input-light.mjs");
    const actual = await evaluate(output.code, "output-light.mjs");
    assert.strictEqual(actual, expected);
  });

  it("supports TypeScript Vue script blocks", async () => {
    const input = `
      import { f } from "@bignum/template";

      const price: number = 0.2;

      export default f\`\${price} + 0.1\`;
    `;

    const output = await runTransform(
      input,
      "/App.vue?vue&type=script&lang.ts",
    );

    assert.ok(output);
    assert.match(output.code, /@bignum\/template\/core/u);
    assert.match(output.code, /const price: number = 0\.2/u);
    assert.match(output.code, /_toResult\(_add\(price, "0\.1"\)\)/u);
  });

  it("supports plain TypeScript without forcing TSX parsing", async () => {
    const input = `
      import { f } from "@bignum/template";

      type Foo = number;
      const inputValue = 0.2;
      const price = <Foo>inputValue;

      export default f\`\${price} + 0.1\`;
    `;

    const output = await runTransform(input, "/entry.ts");

    assert.ok(output);
    assert.match(output.code, /@bignum\/template\/core/u);
    assert.match(output.code, /type Foo = number/u);
    assert.match(output.code, /const price =/u);
  });

  it("supports TSX inputs when JSX syntax is expected", async () => {
    const input = `
      import { f } from "@bignum/template";

      const price: number = 0.2;
      const node = <div>{price}</div>;

      export default [node, f\`\${price} + 0.1\`];
    `;

    const output = await runTransform(input, "/entry.tsx");

    assert.ok(output);
    assert.match(output.code, /@bignum\/template\/core/u);
    assert.ok(output.code.includes("const node = <div>{price}</div>;"));
  });

  it("ignores non-script virtual modules", async () => {
    const output = await runTransform(
      'import { f } from "@bignum/template";',
      "/App.vue?vue&type=template",
    );

    assert.strictEqual(output, null);
  });
});
