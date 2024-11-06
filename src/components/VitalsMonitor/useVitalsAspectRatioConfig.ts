import { getVitalsCanvasSizeAndDuration } from "@/components/VitalsMonitor/utils";

import useBreakpoints from "@/hooks/useBreakpoints";

export default function useVitalsAspectRatioConfig(
  breakpointsMap: Parameters<typeof useBreakpoints<number | undefined>>[0],
) {
  const vitalsAspectRatio = useBreakpoints(breakpointsMap);

  const config = getVitalsCanvasSizeAndDuration(vitalsAspectRatio);
  const hash = JSON.stringify(config);

  return { config, hash };
}
