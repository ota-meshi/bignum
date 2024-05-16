type TempTable = {
  /** Prepare for the next digit. */
  prepare(): void;
  /** Returns the consumed value corresponding to the given digit value. */
  amount(nn: bigint): bigint;
  /** Set the currently calculated value. */
  set(digits: bigint): void;
};

/** Create nth root temporary calc table */
export function createNthRootTable(n: bigint): TempTable {
  const times = createPascalTriangleLineBy(n).slice(1, -1);

  const parts = Array(times.length).fill(0n);
  return {
    prepare() {
      for (let i = 0; i < parts.length; i++) parts[i] *= 10n ** BigInt(i + 1);
    },
    amount(nn: bigint) {
      let a = nn;
      for (let i = 0; i < parts.length; i++) {
        a = (parts[i] + a) * nn;
      }
      return a;
    },
    set(digits: bigint) {
      for (let i = 0; i < parts.length; i++) {
        parts[i] = digits ** BigInt(i + 1) * times[i];
      }
    },
  };
}

/** Create pascal triangle line for the given n */
function createPascalTriangleLineBy(n: bigint) {
  let table = [1n, 1n];
  for (let i = 1; i < n; i++) {
    const next: bigint[] = [1n];
    for (let j = 1; j < table.length; j++) next[j] = table[j - 1] + table[j];
    next.push(1n);
    table = next;
  }
  return table;
}
