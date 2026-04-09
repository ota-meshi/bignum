import {
  RoundingMode,
  type MathOptions,
  type IsOverflow,
  type OverflowContext,
} from "../options.mts";

const DEF_OPT: IsOverflow = (ctx) => ctx.scale > 0n && ctx.precision > 20n;

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
  const overflow = options?.overflow ?? DEF_OPT;
  const rm = options?.roundingMode ?? RoundingMode.trunc;
  let intVal = 0n,
    exponent = initExponent,
    precision = 1n;
  const overflowCtx: OverflowContext = {
    get scale() {
      return -exponent;
    },
    get precision() {
      return precision;
    },
  };
  return {
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
      const nextDigits: bigint[] = [];
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
        throw new Error(`Unknown rounding mode: ${JSON.stringify(rm)}`);
      }
    },
  };
}
