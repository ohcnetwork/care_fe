import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { useScheduleResource } from "@/components/Schedule/useScheduleResource";
import { cn } from "@/lib/utils";
import {
  formatScheduleResourceName,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import { renderTokenNumber } from "@/types/tokens/token/token";
import {
  TokenSubQueueRead,
  TokenSubQueueStatus,
} from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import tokenSubQueueApi from "@/types/tokens/tokenSubQueue/tokenSubQueueApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { useQueries, UseQueryResult } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface TokenDisplayProps {
  facilityId: string;
  resources: { resourceType: SchedulableResourceType; resourceId: string }[];
}

const REFRESH_INTERVAL = 10000; // 10 seconds

const combineResourceSubQueues = (
  result: UseQueryResult<{
    subQueues: TokenSubQueueRead[];
    resourceType: SchedulableResourceType;
    resourceId: string;
  }>[],
) => {
  return result
    .filter((query) => query.data) // Voluntarily ignoring queries that are not successful to make it resilient to errors
    .flatMap(({ data }) =>
      (data!.subQueues ?? []).map((subQueue) => ({
        ...subQueue,
        resourceType: data!.resourceType,
        resourceId: data!.resourceId,
      })),
    );
};

export const TokenDisplay = ({ facilityId, resources }: TokenDisplayProps) => {
  const { t } = useTranslation();

  const sp = useQueries({
    queries: resources.map((resource) => ({
      queryKey: ["subQueues", facilityId, resource],
      queryFn: query(tokenSubQueueApi.list, {
        pathParams: { facility_id: facilityId },
        queryParams: {
          resource_type: resource.resourceType,
          resource_id: resource.resourceId,
          status: TokenSubQueueStatus.ACTIVE,
        },
        silent: true,
      }),
      refetchInterval: REFRESH_INTERVAL,
      select: (data: PaginatedResponse<TokenSubQueueRead>) => ({
        ...resource,
        subQueues: data.results,
      }),
    })),
    combine: combineResourceSubQueues,
  });

  if (sp.length === 0) {
    return <Loading />;
  }

  const servicePoints = [...sp].slice(0, 10);

  const itemCount = servicePoints.length;

  const getGridClass = () => {
    switch (itemCount) {
      case 1:
        return "grid-cols-1";
      case 2:
      case 3:
      case 4:
        return "grid-cols-2";
      default:
        return "grid-cols-6";
    }
  };

  const getColSpan = (index: number) => {
    // Two-column layout
    if (itemCount === 3) return index === 2 ? 2 : 1; // For 3 items, the last item should span 2 columns
    if (itemCount <= 4) return 1; // For all other cases in 4 col layout, column span is 1

    // Three-column layout
    // For more than 4 items, we first find the number of items in the last row
    const lastRowCount = itemCount % 3;
    // If the last row has 1 item, the last item should span 6 columns
    if (lastRowCount === 1 && index == itemCount - 1) return 6;
    // If the last row has 2 items, the last 2 items should span 3 columns
    if (lastRowCount === 2 && index >= itemCount - 2) return 3;
    // In all other cases, it should span 2 columns
    return 2;
  };

  return (
    <Page title={t("token_display")} hideTitleOnPage>
      <div
        className={`grid gap-2 -mx-12 -my-12 bg-[#1FB6C9] h-screen p-3 [container-type:inline-size] ${getGridClass()}`}
      >
        {servicePoints.map((servicePoint, index) => (
          <div
            key={servicePoint.id}
            className={cn(
              "flex flex-col  h-full",
              [
                "col-span-1",
                "col-span-2",
                "col-span-3",
                "col-span-4",
                "col-span-5",
                "col-span-6",
              ][getColSpan(index) - 1],
            )}
          >
            <ServicePointDisplay facilityId={facilityId} {...servicePoint} />
          </div>
        ))}
      </div>
    </Page>
  );
};

type ServicePointDisplayProps = NonNullable<
  ReturnType<typeof combineResourceSubQueues>
>[number] & { facilityId: string };

const ServicePointDisplay = ({
  facilityId,
  resourceType,
  resourceId,
  current_token,
  name,
}: ServicePointDisplayProps) => {
  const [hasCurrentTokenChanged, setHasCurrentTokenChanged] = useState(false);
  const tokenNumber = current_token ? renderTokenNumber(current_token) : "--";

  useEffect(() => {
    if (current_token) {
      setHasCurrentTokenChanged(true);

      setTimeout(() => {
        setHasCurrentTokenChanged(false);
      }, 4000);
    }
  }, [tokenNumber]);

  const resource = useScheduleResource({
    resourceType,
    resourceId,
    facilityId,
  });

  console.log(hasCurrentTokenChanged);

  return (
    <>
      <div className="w-full text-center p-4 bg-[#122235] text-[clamp(2rem,25cqw,4rem)]">
        <span className="font-bold text-white uppercase whitespace-nowrap">
          {name}
        </span>
        {resource && (
          <div className="text-4xl text-white">
            {formatScheduleResourceName(resource)}
          </div>
        )}
      </div>
      <div
        className={cn(
          "flex items-center justify-center font-bold h-full transition-colors duration-500",
          hasCurrentTokenChanged
            ? "bg-[#FFD83D] text-[#07131F]"
            : "bg-[#07131F] text-[#FFD83D]",
        )}
      >
        <span className="text-[clamp(2rem,25cqw,6rem)]">{tokenNumber}</span>
      </div>
    </>
  );
};
