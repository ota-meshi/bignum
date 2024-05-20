// See https://fermiumbay13.hatenablog.com/entry/2019/03/07/002938

type TempTable = {
  /** Prepare for the next digit. */
  prepare(): void;
  /** Returns the consumed value corresponding to the given digit value. */
  amount(n: bigint): bigint;
  /** Set the currently calculated value. */
  set(value: bigint): void;
};

/** Create nth root temporary calc table */
export function createNthRootTable(nth: bigint): TempTable {
  const times = createPascalTriangleLineBy(nth);

  const parts = times.map(() => 0n);
  const len = parts.length;
  return {
    prepare() {
      let tmp = 1n;
      for (let i = 0; i < len; i++) parts[i] *= tmp *= 10n;
    },
    amount(n: bigint) {
      return parts.reduce((a, v) => (a + v) * n, n);
    },
    set(value: bigint) {
      let tmp = 1n;
      for (let i = 0; i < len; i++) parts[i] = (tmp *= value) * times[i];
    },
  };
}

const pascalTriangle: bigint[][] = [[]];

/** Create pascal triangle line for the given n */
function createPascalTriangleLineBy(n: bigint) {
  const result = pascalTriangle[Number(n) - 1];
  if (result) return result;
  let table = pascalTriangle.at(-1)!;
  for (let i = pascalTriangle.length; i < n; i++) {
    // calc next line
    let p = 1n;
    table = table.map((v) => p + (p = v));
    table.push(p + 1n);
    pascalTriangle.push(table);
  }
  return table;
}
