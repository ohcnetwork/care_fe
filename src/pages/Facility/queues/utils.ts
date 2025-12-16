import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import { TokenQueueSummary } from "@/types/tokens/tokenQueue/tokenQueue";
import query from "@/Utils/request/query";
import careConfig from "@careConfig";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
export function getTokenQueueStatusCount(
  summary: TokenQueueSummary,
  ...statuses: TokenStatus[]
) {
  return statuses.reduce((acc, status) => {
    Object.values(summary).forEach((category) => {
      acc += category[status] ?? 0;
    });
    return acc;
  }, 0);
}
const PAGE_SIZE = 50;

export function useTokenListInfiniteQuery({
  facilityId,
  queueId,
  qParams,
}: {
  facilityId: string;
  queueId: string;
  qParams?: Record<string, unknown>;
}) {
  const [{ autoRefresh }] = useQueryParams();
  return useInfiniteQuery({
    queryKey: ["infinite-tokens", facilityId, queueId, qParams],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(tokenApi.list, {
        pathParams: { facility_id: facilityId, queue_id: queueId },
        queryParams: {
          ...qParams,
          limit: PAGE_SIZE,
          offset: pageParam,
        },
      })({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * PAGE_SIZE;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    refetchInterval:
      autoRefresh === "true"
        ? careConfig.appointmentAndQueueRefreshInterval
        : false,
  });
}

// Compact URL-safe prefixes for resource types used in token display routes
// p: Practitioner, l: Location, h: HealthcareService
const resourceTypeToPrefix = {
  [SchedulableResourceType.Practitioner]: "p",
  [SchedulableResourceType.Location]: "l",
  [SchedulableResourceType.HealthcareService]: "h",
} as const;

// Reverse mapping from URL prefix to resource type
const prefixToResourceType = {
  p: SchedulableResourceType.Practitioner,
  l: SchedulableResourceType.Location,
  h: SchedulableResourceType.HealthcareService,
} as const;

export function encodeTokenDisplayResourcesParam(
  resources: { resourceType: SchedulableResourceType; resourceId: string }[],
) {
  return resources
    .map(
      ({ resourceType, resourceId }) =>
        `${resourceTypeToPrefix[resourceType]}:${resourceId}`,
    )
    .join(",");
}

export function decodeTokenDisplayResourcesParam(param: string) {
  return param.split(",").map((resourceStr) => {
    const [type, id] = resourceStr.split(":");
    return {
      resourceType:
        prefixToResourceType[type as keyof typeof prefixToResourceType],
      resourceId: id,
    };
  });
}
