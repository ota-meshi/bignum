export type OverflowContext = {
  scale: bigint;
  precision: bigint;
};
export type IsOverflow = (context: OverflowContext) => boolean;
export type MathOptions = {
  /** You can specify an overflow test function. */
  overflow?: IsOverflow;
  /**
   * Specifies a rounding behavior for numerical operations capable of discarding precision.
   * If rounding must be performed to generate a result with the given scale, the specified rounding mode is applied.
   */
  roundingMode?: RoundingMode;
};
/** Specifies a rounding behavior for numerical operations capable of discarding precision. */
export enum RoundingMode {
  trunc,
  round,
  floor,
  ceil,
}
