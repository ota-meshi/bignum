export type OverflowContext = {
  scale: bigint;
  precision: bigint;
};
export type IsOverflow = (
  context: OverflowContext,
) => boolean | undefined | null;
export type MathOptions = {
  /** You can specify an overflow test function. */
  overflow?: IsOverflow;
  /** @deprecated The maximum number of decimal places. */
  maxDp?: bigint;
  /** @deprecated The maximum number of precision when having decimals. */
  maxDecimalPrecision?: bigint;
};
export type DivideOptions = MathOptions;
export type SqrtOptions = MathOptions;
export type NthRootOptions = MathOptions;
/** This is used in negative pows. */
export type PowOptions = MathOptions;
