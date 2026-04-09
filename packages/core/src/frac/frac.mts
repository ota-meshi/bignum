import { abs, gcd } from "./util.mjs";

// Emit repeating decimals in 9-digit chunks so each BigInt division yields several output digits.
const CHUNK_BASE = 1_000_000_000n;
const CHUNK_DIGITS = 9;
// Strip large powers of 10 before falling back to 5/2 factor counting.
const TEN_POW_FACTORS = [
  [1_000_000_000_000_000_000n, 18n],
  [1_000_000_000n, 9n],
  [1000n, 3n],
  [10n, 1n],
];

/**
 * Returns a Frac from the given decimal values
 */
export function numOf(i: bigint, e = 0n): Frac {
  return e >= 0n ? fracOf(i * 10n ** e, 1n) : fracOf(i, 10n ** -e);
}
/**
 * Returns a Frac from the given numerator and denominator
 */
export function fracOf(n: bigint, d: bigint): Frac {
  if (!n) {
    // zero
    return ZERO;
  }
  if (!d) {
    // infinity
    return n >= 0n ? INF : N_INF;
  }
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

/** Internal Fraction type */
export type Frac = {
  /** numerator */
  n: bigint;

  /** denominator */
  d: bigint;
};

/**
 * Returns a string representation of the given Frac
 */
export function toString(x: Frac | null): string {
  if (!x) return "NaN";
  if (!x.d) return x.n > 0 ? "Infinity" : "-Infinity";
  // Integers stay on the cheapest path and avoid decimal formatting entirely.
  if (x.d === 1n) return String(x.n);
  // Try the terminating-decimal path first. It avoids long division entirely and is now the
  // common fast path for many results produced by add/multiply/sqrt.
  // Finite decimals are much cheaper to render directly than through long division.
  const finite = finiteDecimalString(x);
  if (finite) return finite;
  // Fall back to truncated long division for non-terminating decimals such as 1 / 7.
  // Non-finite decimals still need long division, but we emit several digits per step.
  return repeatingDecimalString(x);
}
export const ZERO: Frac = { n: 0n, d: 1n };
export const INF: Frac = { n: 1n, d: 0n };
export const N_INF: Frac = { n: -1n, d: 0n };

/**
 * Returns a finite decimal representation when the denominator only has 2 and 5 factors.
 * Since `fracOf()` reduces the fraction first, this test is enough to decide whether the
 * decimal terminates exactly.
 * Returns `null` when the decimal does not terminate and the caller should use long division.
 */
function finiteDecimalString(x: Frac): string | null {
  let t = x.d;
  // Count the denominator as 2^a * 5^b. Any other prime factor means the decimal repeats.
  let twos = 0n;
  let fives = 0n;
  // Strip large powers of 10 first so long finite decimals avoid many tiny modulus/division steps.
  for (const [factor, step] of TEN_POW_FACTORS) {
    while (!(t % factor)) {
      t /= factor;
      twos += step;
      fives += step;
    }
  }
  while (!(t % 5n)) {
    t /= 5n;
    fives++;
  }
  while (!(t % 2n)) {
    t /= 2n;
    twos++;
  }
  // If anything remains, the reduced denominator contains some prime factor other than 2 or 5,
  // so the decimal expansion cannot terminate.
  if (t !== 1n) return null;

  // Scale is the number of digits after the decimal point once the denominator becomes 10^scale.
  const scale = twos > fives ? twos : fives;
  let digits = abs(x.n);
  // Example: 3 / 40 = 3 / (2^3 * 5). Multiply by the missing 5^2 so we can rewrite it as
  // 75 / 10^3 and then insert the decimal point once.
  // Convert n / (2^a * 5^b) into an integer over 10^scale before placing the decimal point.
  if (twos < scale) digits *= 2n ** (scale - twos);
  if (fives < scale) digits *= 5n ** (scale - fives);

  const sign = x.n < 0n ? "-" : "";
  if (!scale) return `${sign}${digits}`;

  let text = String(digits);
  // Values smaller than 1 need leading zero padding so the split point stays valid.
  // Example: 3 / 40 -> "075" with point at 1 -> "0.75".
  // Ensure there is always at least one digit to the left of the decimal point.
  let point = text.length - Number(scale);
  if (point < 1) {
    text = `${"0".repeat(1 - point)}${text}`;
    point = 1;
  }
  let decimal = text.slice(point);
  // Exact terminating decimals are normalised to the shortest equivalent form.
  // Example: "1.2300" becomes "1.23".
  // Keep canonical output: finite decimals do not need trailing zeroes.
  while (decimal.endsWith("0")) decimal = decimal.slice(0, -1);
  return `${sign}${text.slice(0, point)}${decimal ? `.${decimal}` : ""}`;
}

/**
 * Returns a truncated decimal expansion for fractions with repeating digits.
 * The public string form keeps at most 20 fractional digits for non-terminating decimals.
 */
function repeatingDecimalString(x: Frac): string {
  const sign = x.n < 0n ? "-" : "";
  let remainder = x.n < 0n ? -x.n : x.n;
  // Split off the integer part once, then iterate only on the fractional remainder.
  const integerPart = remainder / x.d;
  remainder %= x.d;

  const integer = String(integerPart);
  // Keep the public formatting contract:
  // - values smaller than 1 preserve leading fractional zeros, then emit up to 20 digits
  // - values with an integer part keep up to 20 digits after the decimal point
  let remaining = 20;
  // Keep leading zeros separate so `0.00012...` does not have to special-case string assembly later.
  let decimalLeadingZero = "";
  let decimal = "";

  // Each iteration is one long-division step in base 10^9:
  // multiply the remainder by 10^9, emit one 9-digit chunk, keep the next remainder.
  // Generate 9 digits at a time to reduce BigInt division overhead in the repeating-decimal path.
  while (remainder > 0n && remaining > 0) {
    // This is long division in base 10^9 instead of base 10.
    remainder *= CHUNK_BASE;
    const chunk = remainder / x.d;
    remainder %= x.d;

    // Every base-10^9 chunk corresponds to exactly 9 decimal digits, including internal zeros.
    let digits = String(chunk).padStart(CHUNK_DIGITS, "0");
    // Values smaller than 1 preserve leading zeros ahead of the first significant digit.
    if (!integerPart && !decimal) {
      const firstNonZero = digits.search(/[^0]/u);
      if (firstNonZero < 0) {
        decimalLeadingZero += digits;
        continue;
      }
      decimalLeadingZero += digits.slice(0, firstNonZero);
      digits = digits.slice(firstNonZero);
    }

    // Only the final chunk may need truncation; earlier chunks are appended whole.
    // The last chunk may contribute only part of its digits if we have reached the precision budget.
    if (digits.length > remaining) {
      digits = digits.slice(0, remaining);
    }
    decimal += digits;
    remaining -= digits.length;
  }

  // This keeps output stable with the historical implementation even when the last emitted
  // chunk ends with zeroes.
  // Keep the same canonical formatting as the previous implementation.
  while (decimal.endsWith("0")) decimal = decimal.slice(0, -1);
  // `decimalLeadingZero` preserves zeros between the decimal point and the first significant digit,
  // while `decimal` holds the significant digits we emitted/truncated above.
  // `decimalLeadingZero` is only non-empty when the fractional part starts with zeros.
  return decimal
    ? `${sign}${integer}.${decimalLeadingZero}${decimal}`
    : integerPart
      ? `${sign}${integer}`
      : "0";
}
