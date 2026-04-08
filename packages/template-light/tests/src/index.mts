import { f } from "../../src/index.mjs";
import * as snap from "@ota-meshi/test-snapshot";

describe("standard tests", () => {
  for (const t of [
    // Doc tests
    // add
    test`${0.1} + ${0.2}`, // 0.3
    // subtract
    test`${0.3} - ${0.1}`, // 0.2
    // multiply
    test`${0.07} * ${100}`, // 7
    // divide
    test`${0.6} / ${0.2}`, // 3
    // modulo
    test`${0.6} % ${0.2}`, // 0
    /* Parentheses */
    test`(${0.1} + ${0.2}) * ${10}`, // 3
    test`${0.1} + ${0.2} * ${10}`, // 2.1
    /* Unary Operators */
    test`${0.3} + ${-0.1}`, // 0.2

    test`${0.000002} * ${10}`, // 0.000002
    test`${0.1} * ${10}`, // 1
    test`${1} + ${2}`,
    test`${0.1} + ${0.1} * ${2}`,
    test`${1}+${2}`,
    test`${1.1} + ${2.1}`,
    test`${1}+${-2}`,
    test`${1}-${+2}`,
    test`${1.1}+${-2.2}`,
    test`${1.2}+${0.8}`,
    test`${1} + ${3}`,
    test`${1} + ${2} * ${3}`,
    test`${1.2} + ${2.3} * ${3.4}`,
    test`(${1} + ${2}) * ${3}`,
    test`${1} * (${-1}*(${23} % ${4}))`,
    test`${1.5} * (${-1}*(${23} % ${4}))`,
    test`${3} - ${3} / ${3}`,
    test`${3.2} - ${3.2} / ${3.2}`,
    test`(${1} + ${2}) * ${3}`,
    test`(${1}+${2})*${3}`,
    test`${2.3} / ${1.1}`,
    test`${2.3} % ${1.1}`,
    test`${"22000000"} / ${1.1}`,
    test`${"1e42"}/${"1e31"}`,
    test`${"1e-42"}*${"1e38"}`,
    test`${"1e+42"}/${"1e31"}`,
    test`${"1.23e42"}/${"1e31"}`,
    test`${"1.23e-42"}*${"1e38"}`,
    test`${"1.23e+42"}/${"1e31"}`,
    test`${"-1.23e42"}/${"1e31"}`,
    test`${"-1.23e-42"}*${"1e38"}`,
    test`${"-1.23e+42"}/${"1e31"}`,
  ]) {
    it(t.name, () => {
      snap.expect(f(...t.param)).toMatchSnapshot();
    });
  }
});
describe("Round tests", () => {
  for (const t of [
    test`${0.1} + ${0.1} + ${0.1}`,
    test`${0.2} + ${0.1}`,
    test`${0.3} - ${0.1}`,
  ]) {
    it(t.name, () => {
      snap.expect(f(...t.param)).toMatchSnapshot();
    });
  }
});
describe("compile cache", () => {
  it("reuses the compiled template for the same callsite", async () => {
    await withWeakMapSpy(async (instances) => {
      const { f: cachedF } = await importFreshTemplateLight();

      expectDeepStrictEqual(
        [evalSameCallsite(cachedF, 1), evalSameCallsite(cachedF, 2)],
        [2, 3],
      );

      const cache = getTemplateCache(instances);
      expectStrictEqual(cache.setKeys.length, 1);
    });
  });

  it("does not share compiled templates across different callsites", async () => {
    await withWeakMapSpy(async (instances) => {
      const { f: cachedF } = await importFreshTemplateLight();

      expectDeepStrictEqual(
        [evalCallsiteA(cachedF, 1), evalCallsiteB(cachedF, 2)],
        [2, 3],
      );

      const cache = getTemplateCache(instances);
      expectStrictEqual(cache.setKeys.length, 2);
      expectNotStrictEqual(cache.setKeys[0], cache.setKeys[1]);
    });
  });
});

/**
 *
 */
function test(
  template: TemplateStringsArray,
  ...substitutions: (number | bigint | string)[]
) {
  let name = "`";
  for (let index = 0; index < template.length; index++) {
    name += template[index];
    if (index < substitutions.length) {
      name += `\${${substitutions[index]}}`;
    }
  }
  name += "`";
  return {
    name,
    param: [template, ...substitutions] as const,
  };
}

type WeakMapSpyInstance = {
  setKeys: object[];
};

let templateLightImportVersion = 0;

async function withWeakMapSpy(
  run: (instances: WeakMapSpyInstance[]) => Promise<void>,
) {
  const OriginalWeakMap = globalThis.WeakMap;
  const instances: WeakMapSpyInstance[] = [];

  class SpyWeakMap<K extends object, V> extends OriginalWeakMap<K, V> {
    public readonly setKeys: object[] = [];

    constructor(entries?: readonly (readonly [K, V])[] | null) {
      super(entries);
      instances.push(this as unknown as WeakMapSpyInstance);
    }

    override set(key: K, value: V): this {
      this.setKeys.push(key);
      return super.set(key, value);
    }
  }

  globalThis.WeakMap = SpyWeakMap as typeof WeakMap;
  try {
    await run(instances);
  } finally {
    // eslint-disable-next-line require-atomic-updates -- For test
    globalThis.WeakMap = OriginalWeakMap;
  }
}

async function importFreshTemplateLight() {
  const url = new URL("../../src/index.mjs", import.meta.url);
  url.searchParams.set("cache-test", String(templateLightImportVersion++));
  return import(url.href);
}

function getTemplateCache(instances: WeakMapSpyInstance[]) {
  const cache = instances.find((instance) => instance.setKeys.length > 0);
  if (!cache) {
    throw new Error("Expected a compile cache entry");
  }
  return cache;
}

function evalSameCallsite(engine: typeof f, value: number | bigint | string) {
  return engine`${value} + ${1}`;
}

function evalCallsiteA(engine: typeof f, value: number | bigint | string) {
  return engine`${value} + ${1}`;
}

function evalCallsiteB(engine: typeof f, value: number | bigint | string) {
  return engine`${value} + ${1}`;
}

function expectStrictEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(
      `Expected ${String(actual)} to strictly equal ${String(expected)}`,
    );
  }
}

function expectNotStrictEqual(actual: unknown, expected: unknown) {
  if (actual === expected) {
    throw new Error("Expected values to be different");
  }
}

function expectDeepStrictEqual(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(actual)} to deeply equal ${JSON.stringify(expected)}`,
    );
  }
}
