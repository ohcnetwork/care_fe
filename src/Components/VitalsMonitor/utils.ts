import { ChannelOptions, VitalsWaveformBase } from "./types";

/**
 * Maps a value from one range to another.
 * Or in mathematical terms, it performs a linear interpolation.
 *
 * @param x0 The lower bound of the input range.
 * @param x1 The upper bound of the input range.
 * @param y0 The lower bound of the output range.
 * @param y1 The upper bound of the output range.
 * @returns A function that maps a value from the input range to the output range.
 * @example
 * const transform = lerp(0, 100, 0, 1);
 * transform(50); // 0.5
 * transform(100); // 1
 * transform(0); // 0
 * transform(200); // 2
 * transform(-100); // -1
 */
export const lerp = (x0: number, x1: number, y0: number, y1: number) => {
  // Original formula:
  // y = y0 + (x - x0) * (y1 - y0) / (x1 - x0)
  //
  // Simplified formula:
  //
  // 1. Take the first order partial derivative out
  //      m = (y1 - y0) / (x1 - x0)
  //    ∴ y = y0 + (x - x0) * m
  //
  // 2. Expanding the (x - x0) term yields:
  //    ∴ y = y0 + x * m - x0 * m
  //
  // 3. Simplify the terms by grouping the constants together:
  //      c = y0 - x0 * m
  //    ∴ y = m * x + c

  const m = (y1 - y0) / (x1 - x0);
  const c = y0 - x0 * m;

  return (x: number) => m * x + c;
};

export const getChannel = (observation: VitalsWaveformBase): ChannelOptions => {
  return {
    samplingRate: parseInt(
      observation["sampling rate"]?.replace("/sec", "") ?? "-1"
    ),
    baseline: observation["data-baseline"] ?? 0,
    lowLimit: observation["data-low-limit"] ?? 0,
    highLimit: observation["data-high-limit"] ?? 0,
  };
};
