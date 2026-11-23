import careConfig from "@careConfig";
import { queryOptions } from "@tanstack/react-query";

import { ObservationPlotConfig } from "@/types/emr/observation/observation";

/** Every reader shares one cache entry, so they must also share one fetch. */
export const plotsConfigQueryOptions = queryOptions<ObservationPlotConfig>({
  queryKey: ["plots-config"],
  queryFn: async ({ signal }) => {
    const response = await fetch(careConfig.plotsConfigUrl, {
      cache: "no-store",
      signal,
    });
    if (!response.ok)
      throw new Error("Unable to load vital signs configuration");
    return response.json();
  },
});
