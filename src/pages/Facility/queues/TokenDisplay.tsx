import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { useScheduleResource } from "@/components/Schedule/useScheduleResource";
import { BatchRequestResponse } from "@/types/base/batch/batch";
import batchApi from "@/types/base/batch/batchApi";
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
import {
  TokenSubQueueRead,
  TokenSubQueueStatus,
} from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface TokenDisplayProps {
  facilityId: string;
  config: { resourceType: SchedulableResourceType; resourceId: string }[];
}

const REFRESH_INTERVAL = 10000; // 10 seconds

export const TokenDisplay = ({ facilityId, config }: TokenDisplayProps) => {
  const { t } = useTranslation();

  const { data: resourceQueues } = useQuery({
    queryKey: ["queues", facilityId, config],
    queryFn: query(batchApi.batchRequest, {
      body: {
        requests: config.map(({ resourceType, resourceId }, index) => ({
          url: `/api/v1/facility/${facilityId}/token/queue/?resource_type=${resourceType}&resource_id=${resourceId}&date=${dayjs().format("YYYY-MM-DD")}`,
          method: "GET",
          reference_id: `${index}`,
        })),
      },
    }),
    select: (data: BatchRequestResponse<PaginatedResponse<TokenQueueRead>>) =>
      data.results.map((queues) => {
        console.log(queues.data?.results, "queues");
        const queueId =
          queues.data?.results.find((q) => q.is_primary)?.id ?? "";
        if (!queueId) {
          toast.error("No queue found");
        }
        return { queueId, ...config[parseInt(queues.reference_id)] };
      }),
  });

  console.log("resourceQueues", resourceQueues);

  const { data: servicePoints } = useQuery({
    queryKey: ["servicePoints", facilityId, resourceQueues],
    queryFn: query(batchApi.batchRequest, {
      body: {
        requests: (resourceQueues ?? []).map(
          ({ resourceId, resourceType }, index) => ({
            url: `/api/v1/facility/${facilityId}/token/sub_queue/?resource_type=${resourceType}&resource_id=${resourceId}&status=${TokenSubQueueStatus.ACTIVE}`,
            method: "GET",
            reference_id: `${index}`,
          }),
        ),
      },
    }),
    enabled: !!resourceQueues?.length,
    select: (
      data: BatchRequestResponse<PaginatedResponse<TokenSubQueueRead>>,
    ) =>
      data.results.flatMap((subQueues) =>
        (subQueues.data?.results ?? []).map((subQueue) => ({
          servicePoint: subQueue,
          ...(resourceQueues ?? [])[parseInt(subQueues.reference_id)],
        })),
      ),
  });

  console.log("servicePoints", servicePoints);

  if (!servicePoints) {
    return <Loading />;
  }

  const itemCount = servicePoints.length;

  // Get grid layout class based on item count
  const getGridClass = () => {
    switch (itemCount) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-2";
      case 5:
        return "grid-cols-6";
      case 6:
        return "grid-cols-3";
      case 7:
        return "grid-cols-8";
      case 8:
        return "grid-cols-4";
      case 9:
        return "grid-cols-3";
      default:
        return "grid-cols-4";
    }
  };

  // Calculate column span for each item
  const getColSpan = (index: number) => {
    if (itemCount === 5) {
      return index < 2 ? 3 : 2;
    }
    if (itemCount === 7) {
      return 2;
    }
    return 1;
  };

  return (
    <Page title={t("token_display")} hideTitleOnPage>
      <div
        className={`grid gap-2 -mx-12 -my-12 bg-[#1FB6C9] h-screen p-3 ${getGridClass()}`}
      >
        {servicePoints.map((servicePoint, index) => (
          <TokenCard
            key={servicePoint.servicePoint.id}
            facilityId={facilityId}
            colSpan={getColSpan(index)}
            resourceType={servicePoint.resourceType}
            resourceId={servicePoint.resourceId}
            queueId={servicePoint.queueId}
            servicePoint={servicePoint.servicePoint}
          />
        ))}
      </div>
    </Page>
  );
};

const TokenCard = ({
  facilityId,
  queueId,
  servicePoint,
  resourceId,
  resourceType,
  colSpan = 1,
}: {
  facilityId: string;
  queueId: string;
  servicePoint: { id: string; name: string };
  resourceType: SchedulableResourceType;
  resourceId: string;
  colSpan?: number;
}) => {
  const { data: token } = useQuery({
    queryKey: ["tokens", facilityId, queueId, servicePoint.id],
    queryFn: query(tokenApi.list, {
      pathParams: { facility_id: facilityId, queue_id: queueId },
      queryParams: {
        sub_queue: servicePoint.id,
        status: TokenStatus.IN_PROGRESS,
        limit: 1,
      },
      silent: true,
    }),
    refetchInterval: REFRESH_INTERVAL,
    select: (data: PaginatedResponse<TokenRead>) => data.results[0],
  });

  const resource = useScheduleResource({
    resourceType,
    resourceId,
    facilityId,
  });

  const colSpanClass =
    colSpan === 2
      ? "col-span-2"
      : colSpan === 3
        ? "col-span-3"
        : colSpan === 4
          ? "col-span-4"
          : "";

  return (
    <div className={`flex flex-col bg-[#07131F] h-full ${colSpanClass}`}>
      <div className="bg-[#122235] w-full text-center p-4">
        <span className="font-bold text-white text-6xl">
          {servicePoint.name}
        </span>
        {resource && (
          <div className="text-2xl text-white">
            {formatScheduleResourceName(resource)}
          </div>
        )}
      </div>
      <div className="flex items-center justify-center text-7xl font-bold text-[#FFD83D] h-full">
        {token ? <span>{renderTokenNumber(token)}</span> : <span>--</span>}
      </div>
    </div>
  );
};
