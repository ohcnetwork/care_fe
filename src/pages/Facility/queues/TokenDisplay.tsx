import Page from "@/components/Common/Page";
import { BatchRequestResponse } from "@/types/base/batch/batch";
import batchApi from "@/types/base/batch/batchApi";
import { renderTokenNumber, TokenStatus } from "@/types/tokens/token/token";
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
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

interface TokenDisplayProps {
  facilityId: string;
}

const REFRESH_INTERVAL = 10000; // 10 seconds

export const TokenDisplay = ({ facilityId }: TokenDisplayProps) => {
  const [qParams] = useQueryParams();
  const { t } = useTranslation();

  const resourcesObj: Record<string, string> = qParams.resources
    ? Object.fromEntries(
        qParams.resources.split(",").map((resource: string) => {
          const [resourceType, resourceId] = resource.split(":");
          return [resourceId, resourceType];
        }),
      )
    : {};

  const { data: resourceQueues } = useQuery({
    queryKey: ["queues", facilityId, resourcesObj],
    queryFn: query(batchApi.batchRequest, {
      body: {
        requests: Object.entries(resourcesObj).map(
          ([resourceId, resouceType]) => ({
            url: `/api/v1/facility/${facilityId}/token/queue/?resource_type=${resouceType}&resource_id=${resourceId}&date=${dayjs().format("YYYY-MM-DD")}`,
            method: "GET",
            reference_id: resourceId,
          }),
        ),
      },
    }),
    select: (data: BatchRequestResponse<PaginatedResponse<TokenQueueRead>>) => {
      const obj: Record<string, string> = {};
      data.results.forEach((result) => {
        obj[result.reference_id] =
          result.data?.results.find((queue) => queue.is_primary)?.id ?? "";
      });

      return obj;
    },
  });

  const { data: resourceServicePoints } = useQuery({
    queryKey: ["servicePoints", facilityId, resourcesObj],
    queryFn: query(batchApi.batchRequest, {
      body: {
        requests: Object.entries(resourcesObj).map(
          ([resourceId, resourceType]) => ({
            url: `/api/v1/facility/${facilityId}/token/sub_queue/?resource_type=${resourceType}&resource_id=${resourceId}&status=${TokenSubQueueStatus.ACTIVE}`,
            method: "GET",
            reference_id: resourceId,
          }),
        ),
      },
    }),
    select: (
      data: BatchRequestResponse<PaginatedResponse<TokenSubQueueRead>>,
    ) => {
      const obj: Record<
        string,
        { servicePointId: string; servicePointName: string }[]
      > = {};

      data.results.forEach((result) => {
        obj[result.reference_id] =
          result.data?.results.map((subQueue) => ({
            servicePointId: subQueue.id,
            servicePointName: subQueue.name,
          })) ?? [];
      });

      return obj;
    },
  });

  // Combine resourceQueues and resourceServicePoints by matching reference_id
  const queueServicePointsMap: Record<
    string,
    { servicePointId: string; servicePointName: string }[]
  > = {};

  if (resourceQueues && resourceServicePoints) {
    Object.keys(resourceQueues).forEach((referenceId) => {
      const queueId = resourceQueues[referenceId];
      const servicePoints = resourceServicePoints[referenceId];

      if (queueId && servicePoints) {
        queueServicePointsMap[queueId] = servicePoints;
      }
    });
  }

  return (
    <Page title={t("token_display")} hideTitleOnPage>
      <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(500px,1fr))] p-4 bg-[#1FB6C9] h-[calc(100vh-3rem)]">
        {Object.entries(queueServicePointsMap).map(([queueId, servicePoints]) =>
          servicePoints.map((servicePoint) => (
            <TokenCard
              key={servicePoint.servicePointId}
              facilityId={facilityId}
              queue_id={queueId}
              servicePointId={servicePoint.servicePointId}
              servicePointName={servicePoint.servicePointName}
            />
          )),
        )}
      </div>
    </Page>
  );
};

const TokenCard = ({
  facilityId,
  queue_id,
  servicePointId,
  servicePointName,
}: {
  facilityId: string;
  queue_id: string;
  servicePointId: string;
  servicePointName: string;
}) => {
  const { data: tokens } = useQuery({
    queryKey: ["tokens", facilityId, queue_id, servicePointId],
    queryFn: query(tokenApi.list, {
      pathParams: { facility_id: facilityId, queue_id: queue_id },
      queryParams: {
        sub_queue: servicePointId,
        status: TokenStatus.IN_PROGRESS,
        limit: 1,
      },
    }),
    refetchInterval: REFRESH_INTERVAL,
  });

  return (
    <div
      key={servicePointId}
      className="flex flex-col bg-[#07131F] border-2 border-[#1FB6C9] p-1"
    >
      <div className="bg-[#122235] font-bold text-white text-6xl w-full text-center p-10">
        {servicePointName}
      </div>
      <div className="flex items-center justify-center text-7xl font-bold text-[#FFD83D] h-full">
        {tokens?.results[0] ? (
          <span>{renderTokenNumber(tokens?.results[0])}</span>
        ) : (
          <span>--</span>
        )}
      </div>
    </div>
  );
};
