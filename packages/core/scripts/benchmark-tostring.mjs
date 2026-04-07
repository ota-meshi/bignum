/* eslint-disable no-console -- benchmark script */
import { performance as nodePerformance } from "node:perf_hooks";
import { BigNum } from "../lib/index.js";

const { arch, env, platform, version } = process;

const BENCH_OPTIONS = {
  warmupMs: Number(env.WARMUP_MS ?? 200),
  sampleMs: Number(env.SAMPLE_MS ?? 400),
  samples: Number(env.SAMPLES ?? 6),
};

const CASE_FILTER = env.CASE_FILTER ? new RegExp(env.CASE_FILTER, "u") : null;

const cases = [
  {
    name: "finite_add",
    value: BigNum.valueOf("123456789.123456789").add("987654321.987654321"),
  },
  {
    name: "repeat_div",
    value: BigNum.valueOf(1).divide(7),
  },
  {
    name: "sqrt_irr",
    value: BigNum.valueOf("0.2").sqrt(),
  },
  {
    name: "finite_long",
    value: BigNum.valueOf("1.000123456789").pow(97),
  },
];

/**
 * Runs the target function repeatedly for a fixed warmup duration.
 */
function warm(fn, ms) {
  const end = nodePerformance.now() + ms;
  while (nodePerformance.now() < end) fn();
}

/**
 * Returns the median value from a numeric sample set.
 */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Measures toString throughput over multiple timed samples.
 */
function benchmark(fn, options) {
  warm(fn, options.warmupMs);
  const values = [];
  for (let i = 0; i < options.samples; i++) {
    const start = nodePerformance.now();
    const end = start + options.sampleMs;
    let count = 0;
    while (nodePerformance.now() < end) {
      fn();
      count++;
    }
    values.push((count * 1000) / (nodePerformance.now() - start));
  }
  return {
    medianOps: median(values),
    minOps: Math.min(...values),
    maxOps: Math.max(...values),
  };
}

/**
 * Truncates long string results for Markdown table output.
 */
function summarize(value) {
  return value.length > 32 ? `${value.slice(0, 32)}...` : value;
}

console.log("# toString benchmark");
console.log(`Node: ${version}`);
console.log(`Platform: ${platform} ${arch}`);
console.log("");

for (const entry of cases.filter((candidateEntry) =>
  CASE_FILTER ? CASE_FILTER.test(candidateEntry.name) : true,
)) {
  const text = entry.value.toString();
  const result = benchmark(() => entry.value.toString(), BENCH_OPTIONS);
  console.log(`## ${entry.name}`);
  console.log("| median ops/sec | min-max | sample |");
  console.log("| ---: | --- | --- |");
  console.log(
    `| ${result.medianOps.toFixed(0)} | ${result.minOps.toFixed(0)}-${result.maxOps.toFixed(0)} | ${summarize(text)} |`,
  );
  console.log("");
}
/* eslint-enable no-console -- benchmark script */
