import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageHeadTitle";
import RotatingText from "@/components/Common/RotatingText";
import { useScheduleResource } from "@/components/Schedule/useScheduleResource";
import { cn } from "@/lib/utils";
import {
  formatScheduleResourceName,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import {
  renderTokenNumber,
  TokenRead,
  TokenStatus,
} from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import { TokenQueueRead } from "@/types/tokens/tokenQueue/tokenQueue";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import {
  TokenSubQueueRead,
  TokenSubQueueStatus,
} from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import tokenSubQueueApi from "@/types/tokens/tokenSubQueue/tokenSubQueueApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import careConfig from "@careConfig";
import { useQueries, useQuery, UseQueryResult } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

interface TokenDisplayProps {
  facilityId: string;
  resources: { resourceType: SchedulableResourceType; resourceId: string }[];
}

const { tokenRefreshInterval, configRefreshInterval } = careConfig.tokenDisplay;

const combineResourceSubQueues = (
  result: UseQueryResult<
    | {
        subQueues: TokenSubQueueRead[];
        resourceType: SchedulableResourceType;
        resourceId: string;
        type: "service_points";
      }
    | {
        queues: TokenQueueRead[];
        resourceType: SchedulableResourceType;
        resourceId: string;
        type: "queues";
      }
  >[],
) => {
  // If any query is pending, return null
  if (result.some((query) => query.status === "pending")) {
    return null;
  }

  const servicePoints: (TokenSubQueueRead & {
    resourceType: SchedulableResourceType;
    resourceId: string;
    queue: TokenQueueRead | undefined;
  })[] = [];

  for (const { data } of result) {
    if (data?.type === "service_points") {
      servicePoints.push(
        ...data.subQueues.map((subQueue) => {
          let queue: TokenQueueRead | undefined;
          for (const { data: queueData } of result) {
            if (
              queueData?.type === "queues" &&
              queueData.resourceType === data.resourceType &&
              queueData.resourceId === data.resourceId
            ) {
              queue = queueData.queues.find((q) => q.is_primary);
            }
          }
          return {
            ...subQueue,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            queue: queue,
          };
        }),
      );
    }
  }

  return servicePoints;
};

/**
 * Returns the grid class for a given item count
 * @param itemCount - The total number of items
 * @returns The grid class (grid-cols-1, grid-cols-2, grid-cols-6)
 */
const getGridClass = (itemCount: number) => {
  if (itemCount === 1) return "grid-cols-1";
  if (itemCount < 5) return "grid-cols-2";
  return "grid-cols-6";
};

/**
 * Returns the column span for a given index and item count
 * @param index - The index of the item
 * @param itemCount - The total number of items
 * @returns The column span (1-6)
 */
const getColSpanClass = (index: number, itemCount: number) => {
  // Two-column layout
  if (itemCount === 3) return index === 2 ? "col-span-2" : "col-span-1"; // For 3 items, the last item should span 2 columns
  if (itemCount <= 4) return "col-span-1"; // For all other cases in 4 col layout, column span is 1

  // Three-column layout
  // For more than 4 items, we first find the number of items in the last row
  const lastRowCount = itemCount % 3;
  // If the last row has 1 item, the last item should span 6 columns
  if (lastRowCount === 1 && index === itemCount - 1) return "col-span-6";
  // If the last row has 2 items, the last 2 items should span 3 columns
  if (lastRowCount === 2 && index >= itemCount - 2) return "col-span-3";
  // In all other cases, it should span 2 columns
  return "col-span-2";
};

export const TokenDisplay = ({ facilityId, resources }: TokenDisplayProps) => {
  const { t } = useTranslation();

  const servicePoints = useQueries({
    queries: resources.flatMap((resource) => [
      {
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
        refetchInterval: configRefreshInterval,
        select: (data: PaginatedResponse<TokenSubQueueRead>) => ({
          ...resource,
          subQueues: data.results,
          type: "service_points" as const,
        }),
      },
      {
        queryKey: ["queues", facilityId, resource],
        queryFn: query(tokenQueueApi.list, {
          pathParams: { facility_id: facilityId },
          queryParams: {
            resource_type: resource.resourceType,
            resource_id: resource.resourceId,
            date: dayjs().format("YYYY-MM-DD"),
          },
          silent: true,
        }),
        refetchInterval: configRefreshInterval,
        select: (data: PaginatedResponse<TokenQueueRead>) => ({
          ...resource,
          queues: data.results,
          type: "queues" as const,
        }),
      },
    ]),
    combine: combineResourceSubQueues,
  });

  if (servicePoints === null) {
    return <Loading />;
  }

  if (servicePoints.length === 0) {
    return (
      <div className="text-center text-white">
        {t("no_service_points_found")}
      </div>
    );
  }

  const itemCount = servicePoints.length;

  return (
    <>
      <PageTitle title={t("token_display")} />
      <div
        className={cn(
          "h-screen -mx-6 -mt-10 -mb-4 bg-[#1FB6C9] [container-type:inline-size] grid gap-4",
          getGridClass(itemCount),
        )}
      >
        {servicePoints
          .filter((servicePoint) => servicePoint.queue)
          .map((servicePoint, index) => (
            <div
              key={servicePoint.id}
              className={getColSpanClass(index, itemCount)}
            >
              <ServicePointDisplay facilityId={facilityId} {...servicePoint} />
            </div>
          ))}
      </div>
    </>
  );
};

type ServicePointDisplayProps = NonNullable<
  ReturnType<typeof combineResourceSubQueues>
>[number] & { facilityId: string };

const ServicePointDisplay = ({
  facilityId,
  queue,
  resourceType,
  resourceId,
  ...subQueue
}: ServicePointDisplayProps) => {
  const { data: token } = useQuery({
    queryKey: ["tokenDisplayToken", facilityId, queue?.id, subQueue.id],
    queryFn: query(tokenApi.list, {
      pathParams: { facility_id: facilityId, queue_id: queue?.id ?? "" },
      queryParams: {
        sub_queue: subQueue.id,
        status: TokenStatus.IN_PROGRESS,
        limit: 1,
      },
    }),
    refetchInterval: tokenRefreshInterval,
    enabled: !!queue,
    select: (data: PaginatedResponse<TokenRead>) => data.results[0],
  });

  const resource = useScheduleResource({
    resourceType,
    resourceId,
    facilityId,
  });

  return (
    <div className="p-4 h-full bg-[#07131F] text-center">
      <div className="p-6 bg-[#122235] rounded-t-2xl">
        <p className="font-bold text-white uppercase whitespace-nowrap text-[clamp(2rem,25cqw,4rem)]">
          {subQueue.name}
        </p>
        {resource && (
          <p className="text-[clamp(1rem,25cqw,2rem)] text-white">
            {formatScheduleResourceName(resource)}
          </p>
        )}
      </div>
      <div
        className={cn(
          "flex items-center justify-center font-black text-[clamp(2rem,25cqw,6rem)] h-[calc(100%-16rem)] bg-[#07131F]",
        )}
      >
        <RotatingText
          texts={token ? [renderTokenNumber(token)] : ["--"]}
          mainClassName="px-2 sm:px-2 md:px-3 text-[#FFD83D] overflow-hidden py-1 md:py-2 justify-center rounded-lg"
          initial={{ y: "250%", scale: 0.3, opacity: 0, rotate: -15 }}
          animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }}
          exit={{ y: "-250%", scale: 0.3, opacity: 0, rotate: 15 }}
          transition={{
            type: "spring",
            damping: 8,
            stiffness: 120,
            mass: 0.5,
          }}
          staggerDuration={0.02}
          staggerFrom="center"
          rotationInterval={1000}
          splitLevelClassName="overflow-hidden"
          animatePresenceMode="wait"
          animatePresenceInitial={false}
        />
      </div>
    </div>
  );
};
