import useBreakpoints from "../../Common/hooks/useBreakpoints";
import { getVitalsCanvasSizeAndDuration } from "./utils";

export default function useVitalsAspectRatioConfig(
  breakpointsMap: Parameters<typeof useBreakpoints<number | undefined>>[0]
) {
  const vitalsAspectRatio = useBreakpoints(breakpointsMap);

  const config = getVitalsCanvasSizeAndDuration(vitalsAspectRatio);
  const hash = JSON.stringify(config);

  return { config, hash };
}
