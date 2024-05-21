import {
  RoundingMode,
  type MathOptions,
  type IsOverflow,
  type OverflowContext,
} from "../options.mts";

const DEF_OPT: IsOverflow = (ctx) => ctx.scale > 0n && ctx.precision > 20n;

/**
 * Assert never.
 */
function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}

/**
 * Parse math options.
 */
function parseOptions(options: MathOptions | undefined): Required<MathOptions> {
  const { overflow, roundingMode } = options ?? {};
  return {
    overflow: overflow ?? DEF_OPT,
    roundingMode: roundingMode ?? RoundingMode.trunc,
  };
}

type NumberContext = {
  /** Set the currently digit. */
  set(n: bigint): void;
  /** Prepare for the next digit. */
  prepareNext(): void;
  getInt(): bigint;
  overflow: () => boolean;
  round(hasRemainder: boolean): void;
  toNum(): [bigint, bigint];
};

/**
 * Create internal number context.
 */
export function numberContext(
  sign: 1 | -1,
  initExponent: bigint,
  options: MathOptions | undefined,
): NumberContext {
  const { overflow, roundingMode: rm } = parseOptions(options);
  let intVal = 0n,
    exponent = initExponent,
    precision = 1n;
  const ctx: NumberContext = {
    set(n: bigint) {
      intVal += n;
    },
    prepareNext() {
      intVal *= 10n;
      exponent--;
      if (intVal) precision++;
    },
    getInt() {
      return intVal;
    },
    overflow: () => overflow(overflowCtx),
    toNum() {
      const signed = sign >= 0 ? intVal : -intVal;
      return exponent >= 0n
        ? [signed * 10n ** exponent, 0n]
        : [signed, exponent];
    },
    round(hasRem: boolean) {
      const nextDigits = [];
      while (overflow(overflowCtx)) {
        exponent++;
        nextDigits.push(intVal % 10n);
        intVal /= 10n;
        precision--;
      }
      if (rm === RoundingMode.trunc) return;
      if (!hasRem && !nextDigits.some((r) => r)) return;
      if (rm === RoundingMode.round) {
        const last = nextDigits.pop() ?? 0n;
        if (
          last >= 5n &&
          (sign > 0 || last > 5n || hasRem || nextDigits.some((r) => r))
        )
          intVal++;
      } else if (rm === RoundingMode.floor) {
        if (sign < 0) intVal++;
      } else if (rm === RoundingMode.ceil) {
        if (sign > 0) intVal++;
      } else {
        assertNever(rm, "Unknown rounding mode");
      }
    },
  };
  const overflowCtx: OverflowContext = {
    get scale() {
      return -exponent;
    },
    get precision() {
      return precision;
    },
  };
  return ctx;
}
