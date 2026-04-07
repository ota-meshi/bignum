/* eslint-disable no-console -- benchmark script */
import { performance as nodePerformance } from "node:perf_hooks";
import { BigNum } from "../lib/index.js";
// eslint-disable-next-line n/no-extraneous-import -- benchmark compares external libraries
import BigNumber from "bignumber.js";
// eslint-disable-next-line n/no-extraneous-import -- benchmark compares external libraries
import { Decimal } from "decimal.js";

const BigNumber20 = BigNumber.clone({
  DECIMAL_PLACES: 20,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  POW_PRECISION: 20,
});

const Decimal20 = Decimal.clone({
  precision: 20,
  rounding: Decimal.ROUND_DOWN,
});

const libs = [
  {
    name: "@bignum/core",
    from: (value) => BigNum.valueOf(value),
    add: (a, b) => a.add(b),
    multiply: (a, b) => a.multiply(b),
    divide: (a, b) => a.divide(b),
    sqrt: (a) => a.sqrt(),
    pow: (a, b) => a.pow(b),
    toString: (value) => value.toString(),
  },
  {
    name: "decimal.js",
    from: (value) => new Decimal20(value),
    add: (a, b) => a.add(b),
    multiply: (a, b) => a.mul(b),
    divide: (a, b) => a.div(b),
    sqrt: (a) => a.sqrt(),
    pow: (a, b) => a.pow(b),
    toString: (value) => value.toString(),
  },
  {
    name: "bignumber.js",
    from: (value) => new BigNumber20(value),
    add: (a, b) => a.plus(b),
    multiply: (a, b) => a.multipliedBy(b),
    divide: (a, b) => a.dividedBy(b),
    sqrt: (a) => a.sqrt(),
    pow: (a, b) => a.pow(b),
    toString: (value) => value.toString(),
  },
];

const cases = [
  {
    name: "add_exact",
    description: "123456789.123456789 + 987654321.987654321",
    setup(lib) {
      const a = lib.from("123456789.123456789");
      const b = lib.from("987654321.987654321");
      return () => lib.add(a, b);
    },
  },
  {
    name: "multiply_exact",
    description: "12345.6789012345 * 98765.4321098765",
    setup(lib) {
      const a = lib.from("12345.6789012345");
      const b = lib.from("98765.4321098765");
      return () => lib.multiply(a, b);
    },
  },
  {
    name: "divide_repeating",
    description: "1 / 7",
    setup(lib) {
      const a = lib.from("1");
      const b = lib.from("7");
      return () => lib.divide(a, b);
    },
  },
  {
    name: "sqrt_irrational",
    description: "sqrt(0.2)",
    setup(lib) {
      const a = lib.from("0.2");
      return () => lib.sqrt(a);
    },
  },
  {
    name: "pow_integer_exact",
    description: "1.000123456789 ^ 97",
    setup(lib) {
      const a = lib.from("1.000123456789");
      return () => lib.pow(a, 97);
    },
  },
  {
    name: "pow_fractional",
    description: "2 ^ 2.2",
    setup(lib) {
      const a = lib.from("2");
      const b = lib.from("2.2");
      return () => lib.pow(a, b);
    },
  },
  {
    name: "mixed_expression",
    description: "sqrt((355 / 113) + (0.125 * 16))",
    setup(lib) {
      const a = lib.from("355");
      const b = lib.from("113");
      const c = lib.from("0.125");
      const d = lib.from("16");
      return () => lib.sqrt(lib.add(lib.divide(a, b), lib.multiply(c, d)));
    },
  },
];

const { arch, env, platform, version } = process;

const CASE_FILTER = env.CASE_FILTER ? new RegExp(env.CASE_FILTER, "u") : null;
const MODE_FILTER = env.MODE_FILTER ? new RegExp(env.MODE_FILTER, "u") : null;

const BENCH_OPTIONS = {
  warmupMs: Number(env.WARMUP_MS ?? 150),
  sampleMs: Number(env.SAMPLE_MS ?? 300),
  samples: Number(env.SAMPLES ?? 4),
  batch: Number(env.BATCH ?? 50),
};

let sink = 0;

/**
 * Runs the benchmark function repeatedly for a fixed warmup duration.
 */
function burn(fn, durationMs, batch, consume) {
  const endAt = nodePerformance.now() + durationMs;
  let iterations = 0;
  while (nodePerformance.now() < endAt) {
    for (let index = 0; index < batch; index++) {
      sink ^= consume(fn());
      iterations++;
    }
  }
  return iterations;
}

/**
 * Measures throughput over multiple timed samples.
 */
function benchmark(fn, options, consume) {
  const { warmupMs, sampleMs, samples, batch } = options;
  burn(fn, warmupMs, batch, consume);

  const values = [];
  for (let sample = 0; sample < samples; sample++) {
    const start = nodePerformance.now();
    let iterations = 0;
    const endAt = start + sampleMs;
    while (nodePerformance.now() < endAt) {
      for (let index = 0; index < batch; index++) {
        sink ^= consume(fn());
        iterations++;
      }
    }
    const elapsedMs = nodePerformance.now() - start;
    values.push((iterations * 1000) / elapsedMs);
  }
  return {
    medianOps: median(values),
    minOps: Math.min(...values),
    maxOps: Math.max(...values),
  };
}

/**
 * Returns the median value from a numeric sample set.
 */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const center = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[center - 1] + sorted[center]) / 2
    : sorted[center];
}

/**
 * Formats operations per second for table output.
 */
function formatOps(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}k`;
  return value.toFixed(2);
}

/**
 * Formats speed relative to the fastest implementation.
 */
function formatRelative(value, fastest) {
  return `${(value / fastest).toFixed(2)}x`;
}

/**
 * Truncates long result strings for Markdown table display.
 */
function summarizeOutput(value) {
  return value.length > 28 ? `${value.slice(0, 28)}...` : value;
}

/**
 * Reduces benchmark results to a small numeric sink to avoid dead-code elimination.
 */
function consumeValue(value) {
  if (typeof value === "string") return value.length;
  return value ? 1 : 0;
}

const BENCH_MODES = [
  {
    name: "op_only",
    run: ({ operation }) => operation,
  },
  {
    name: "op_plus_toString",
    run:
      ({ operation, lib }) =>
      () =>
        lib.toString(operation()),
  },
];

console.log("# Library comparison benchmark");
console.log(`Node: ${version}`);
console.log(`Platform: ${platform} ${arch}`);
console.log("");

for (const testCase of cases.filter((candidateCase) =>
  CASE_FILTER ? CASE_FILTER.test(candidateCase.name) : true,
)) {
  console.log(`## ${testCase.name}`);
  console.log(testCase.description);

  const outputs = [];
  const unsupported = [];
  for (const lib of libs) {
    try {
      const operation = testCase.setup(lib);
      outputs.push({
        name: lib.name,
        lib,
        operation,
        output: lib.toString(operation()),
      });
    } catch (error) {
      unsupported.push({
        name: lib.name,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const mode of BENCH_MODES.filter((candidateMode) =>
    MODE_FILTER ? MODE_FILTER.test(candidateMode.name) : true,
  )) {
    console.log(`### ${mode.name}`);
    const results = outputs.map(({ name, lib, operation, output }) => ({
      name,
      output,
      ...benchmark(mode.run({ lib, operation }), BENCH_OPTIONS, consumeValue),
    }));

    const fastest = Math.max(...results.map((result) => result.medianOps));

    console.log("| Library | ops/sec (median) | relative | min-max | result |");
    console.log("| --- | ---: | ---: | --- | --- |");
    for (const result of [...results].sort(
      (a, b) => b.medianOps - a.medianOps,
    )) {
      console.log(
        `| ${result.name} | ${formatOps(result.medianOps)} | ${formatRelative(result.medianOps, fastest)} | ${formatOps(result.minOps)}-${formatOps(result.maxOps)} | ${summarizeOutput(result.output)} |`,
      );
    }
    console.log("");
  }
  const uniqueOutputs = [...new Set(outputs.map((entry) => entry.output))];
  if (uniqueOutputs.length > 1) {
    console.log("");
    console.log("Result notes:");
    for (const entry of outputs) {
      console.log(`- ${entry.name}: ${entry.output}`);
    }
  }
  if (unsupported.length) {
    console.log("");
    console.log("Unsupported:");
    for (const entry of unsupported) {
      console.log(`- ${entry.name}: ${entry.reason}`);
    }
  }
  console.log("");
}

if (sink === Number.MIN_SAFE_INTEGER) {
  console.log("ignore:", sink);
}
/* eslint-enable no-console -- benchmark script */
