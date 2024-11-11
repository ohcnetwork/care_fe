import { AssetClass, AssetData } from "@/components/Assets/AssetTypes";
import {
  ChannelOptions,
  VitalsWaveformBase,
} from "@/components/VitalsMonitor/types";

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
      observation["sampling rate"]?.replace("/sec", "") ?? "-1",
    ),
    baseline: observation["data-baseline"] ?? 0,
    lowLimit: observation["data-low-limit"] ?? 0,
    highLimit: observation["data-high-limit"] ?? 0,
  };
};

const DEFAULT_RATIO = 13 / 11;
const DEFAULT_DURATION = 7;
const DEFAULT_SCALE = 38 * 11;

/**
 * Returns the size of the canvas for the vitals monitor.
 * @param aspectRatio The aspect ratio of the canvas. Defaults to 13:11.
 * @param scale The scale of the canvas. Defaults to 38 * 11.
 * @returns The computed size of the canvas.
 */
export const getVitalsCanvasSizeAndDuration = (
  ratio = DEFAULT_RATIO,
  scale = DEFAULT_SCALE,
) => {
  return {
    size: {
      width: scale * ratio,
      height: scale,
    },
    duration: DEFAULT_DURATION * (ratio / DEFAULT_RATIO),
  };
};

export const getVitalsMonitorSocketUrl = (asset: AssetData) => {
  if (
    asset.asset_class !== AssetClass.HL7MONITOR &&
    asset.asset_class !== AssetClass.VENTILATOR
  ) {
    throw "getVitalsMonitorSocketUrl can be invoked only for HL7MONITOR or VENTILATOR assets";
  }

  const middleware = asset.resolved_middleware?.hostname;
  const ipAddress = asset.meta?.local_ip_address;

  if (middleware && ipAddress) {
    return `wss://${middleware}/observations/${ipAddress}`;
  }
};
