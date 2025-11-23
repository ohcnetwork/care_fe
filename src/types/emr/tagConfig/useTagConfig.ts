import { useQueries, useQuery } from "@tanstack/react-query";

import query from "@/Utils/request/query";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";

interface Options {
  ids: TagConfig["id"][];
  facilityId?: string;
  disabled?: boolean;
}

function getQueryOptions(
  id: TagConfig["id"],
  facilityId?: string,
  disabled?: boolean,
) {
  return {
    queryKey: ["tagConfig", id, facilityId],
    queryFn: query(tagConfigApi.retrieve, {
      pathParams: { external_id: id },
      queryParams: facilityId ? { facility: facilityId } : undefined,
    }),
    enabled: !disabled,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    meta: {
      persist: true,
    },
  };
}

export function useTagConfig(id: TagConfig["id"], facilityId?: string) {
  return useQuery(getQueryOptions(id, facilityId));
}

export default function useTagConfigs({ ids, facilityId, disabled }: Options) {
  return useQueries({
    queries: ids
      .filter(Boolean)
      .map((id) => getQueryOptions(id, facilityId, disabled)),
  });
}
