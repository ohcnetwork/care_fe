import { useQuery } from "@tanstack/react-query";

import query from "@/Utils/request/query";
import { Route } from "@/Utils/request/types";

export const usePatientExport = (
  route: Route<unknown, unknown>,
  queryParams: Record<string, unknown> = {},
  pathParams: Record<string, string | number> = {},
) => {
  return useQuery({
    queryKey: [route, "csv"],
    queryFn: query(route, {
      queryParams: { ...queryParams, csv: true },
      pathParams,
    }),
    enabled: false,
  });
};
