import Page from "@/components/Common/Page";
import { useScheduleResource } from "@/components/Schedule/useScheduleResource";
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
import { TokenSubQueueStatus } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import tokenSubQueueApi from "@/types/tokens/tokenSubQueue/tokenSubQueueApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

interface TokenDisplayProps {
  facilityId: string;
  config: { resourceType: SchedulableResourceType; resourceId: string }[];
}

const REFRESH_INTERVAL = 10000; // 10 seconds

export const TokenDisplay = ({ facilityId, config }: TokenDisplayProps) => {
  const { t } = useTranslation();

  return (
    <Page title={t("token_display")} hideTitleOnPage>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(64rem,1fr))] gap-2 -mx-12 -my-12 bg-[#1FB6C9] h-screen p-3">
        {config.map(({ resourceType, resourceId }, index) => (
          <ResourceTokens
            key={index}
            resourceType={resourceType}
            resourceId={resourceId}
            facilityId={facilityId}
          />
        ))}
      </div>
    </Page>
  );
};

const ResourceTokens = ({
  resourceType,
  resourceId,
  facilityId,
}: {
  resourceType: SchedulableResourceType;
  resourceId: string;
  facilityId: string;
}) => {
  const { data: queue } = useQuery({
    queryKey: ["queues", facilityId, resourceType, resourceId],
    queryFn: query(tokenQueueApi.list, {
      queryParams: {
        resource_type: resourceType,
        resource_id: resourceId,
        date: dayjs().format("YYYY-MM-DD"),
      },
      pathParams: { facility_id: facilityId },
      silent: true,
    }),
    select: (data: PaginatedResponse<TokenQueueRead>) => {
      return data?.results.find((q) => q.is_primary)?.id;
    },
  });

  if (!queue) {
    return null;
  }

  return (
    <ServicePointTokens
      facilityId={facilityId}
      queueId={queue}
      resourceType={resourceType}
      resourceId={resourceId}
    />
  );
};

const ServicePointTokens = ({
  facilityId,
  queueId,
  resourceType,
  resourceId,
}: {
  facilityId: string;
  queueId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
}) => {
  const { data } = useQuery({
    queryKey: ["subQueues", facilityId, resourceType, resourceId],
    queryFn: query(tokenSubQueueApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
        resource_id: resourceId,
        status: TokenSubQueueStatus.ACTIVE,
        limit: 100, // We are assuming that a resource will not have more than 100 sub-queues due to obvious practical reasons...
      },
    }),
  });

  if (!data) {
    return null;
  }

  const subQueues = data.results;

  return (
    <>
      {subQueues.map((subQueue) => (
        <TokenCard
          key={subQueue.id}
          facilityId={facilityId}
          queueId={queueId}
          servicePoint={subQueue}
          resourceType={resourceType}
          resourceId={resourceId}
        />
      ))}
    </>
  );
};

const TokenCard = ({
  facilityId,
  queueId,
  servicePoint,
  resourceId,
  resourceType,
}: {
  facilityId: string;
  queueId: string;
  servicePoint: { id: string; name: string };
  resourceType: SchedulableResourceType;
  resourceId: string;
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

  return (
    <div className="flex flex-col bg-[#07131F] h-full">
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
