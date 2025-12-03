import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageHeadTitle";
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
import { AnimatePresence, motion } from "framer-motion";
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

  const servicePoints = useQueries({
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

  if (servicePoints.length === 0) {
    return <Loading />;
  }

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
    <>
      <PageTitle title={t("token_display")} />
      <div
        className={cn(
          "h-screen -mx-6 -mt-10 -mb-4 bg-[#1FB6C9] [container-type:inline-size] grid gap-4",
          getGridClass(),
        )}
      >
        {servicePoints.map((servicePoint, index) => (
          <div
            key={servicePoint.id}
            className={
              [
                "col-span-1",
                "col-span-2",
                "col-span-3",
                "col-span-4",
                "col-span-5",
                "col-span-6",
              ][getColSpan(index) - 1]
            }
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
  resourceType,
  resourceId,
  current_token,
  name,
}: ServicePointDisplayProps) => {
  const [hasRecentlyChanged, setHasRecentlyChanged] = useState(false);
  const tokenNumber = current_token ? renderTokenNumber(current_token) : "--";

  useEffect(() => {
    if (tokenNumber !== "--") {
      setTimeout(() => {
        setHasRecentlyChanged(true);
      }, 1000);
      setTimeout(() => {
        setHasRecentlyChanged(false);
      }, 4000);
    }
  }, [tokenNumber]);

  const resource = useScheduleResource({
    resourceType,
    resourceId,
    facilityId,
  });

  return (
    <div className="p-4 h-full bg-[#07131F] text-center">
      <div className="p-6 bg-[#122235] rounded-t-2xl">
        <p className="font-bold text-white uppercase whitespace-nowrap text-[clamp(2rem,25cqw,4rem)]">
          {name}
        </p>
        {resource && (
          <p className="text-[clamp(1rem,25cqw,2rem)] text-white">
            {formatScheduleResourceName(resource)}
          </p>
        )}
      </div>
      <div
        className={cn(
          "flex items-center justify-center font-black text-[clamp(2rem,25cqw,6rem)] h-[calc(100%-16rem)] transition-colors duration-500",
          hasRecentlyChanged ? "bg-[#FFD83D] text-[#07131F]" : "text-[#FFD83D]",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={tokenNumber}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{
              type: "tween",
              duration: 1,
              ease: "easeInOut",
            }}
            className="inline-block"
          >
            {tokenNumber}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};
