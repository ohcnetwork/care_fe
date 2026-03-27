import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AssignToServicePointDialog } from "@/pages/Facility/queues/AssignToServicePointDialog";
import { TokenCard } from "@/pages/Facility/queues/TokenCard";
import { useQueueServicePoints } from "@/pages/Facility/queues/useQueueServicePoints";
import { getTokenStatus } from "@/pages/Facility/queues/utils";
import { FacilityRead } from "@/types/facility/facility";
import { formatScheduleResourceName } from "@/types/scheduling/schedule";
import {
  renderTokenNumber,
  TOKEN_STATUS_COLORS,
  TokenRetrieve,
  TokenStatus,
} from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { useState } from "react";
import { toast } from "sonner";

interface TokenViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility: FacilityRead;
  queueId: string;
  tokenId: string;
}

export default function TokenViewModal({
  open,
  onOpenChange,
  facility,
  queueId,
  tokenId,
}: TokenViewModalProps) {
  const { t } = useTranslation();
  const [showServicepointDialog, setShowServicepointDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: token, isLoading } = useQuery({
    queryKey: ["token", facility.id, queueId, tokenId],
    queryFn: query(tokenApi.get, {
      pathParams: {
        facility_id: facility.id,
        queue_id: queueId,
        id: tokenId,
      },
    }),
    enabled: !!queueId && !!tokenId,
  });

  const { assignedServicePoints } = useQueueServicePoints({
    facilityId: facility.id,
    resourceType: token?.resource_type,
    resourceId: token?.resource.id,
  });

  const { mutate: updateToken, isPending } = useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: facility.id,
        queue_id: token?.queue.id ?? "",
        id: token?.id ?? "",
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facility.id, token?.queue.id ?? ""],
      });
      queryClient.invalidateQueries({
        queryKey: ["tokens", token?.patient?.id, facility.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facility.id, token?.queue.id ?? ""],
      });
      toast.success(t("token_assigned_to_service_point"));
      setShowServicepointDialog(false);
      onOpenChange(false);
    },
  });

  const isOnlyOneSubQueue = assignedServicePoints.length === 1;

  if (isLoading || !token) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 gap-0">
          <div className="bg-gray-50 p-2">
            <div className="flex items-center justify-between gap-2 py-2 px-3">
              <div className="space-y-1 flex-1">
                <div className="text-base font-semibold">
                  {renderTokenNumber(token)}
                </div>
                <div className="text-sm text-gray-600">
                  {formatScheduleResourceName(token)}
                </div>
              </div>
              <Badge
                variant={TOKEN_STATUS_COLORS[token.status]}
                className="px-2 py-1 mr-7 mb-5 rounded-sm shrink-0"
              >
                {getTokenStatus({ token, t })}
              </Badge>
            </div>

            <div
              id={`print-token-${token.id}`}
              className="print:block print:w-[400px] print:border print:rounded-md bg-white space-y-2 rounded-md "
            >
              <TokenCard
                showlogo={false}
                token={token as TokenRetrieve}
                facility={facility}
                id={`token-card-${token.id}`}
                className="hover:scale-none"
                tokenActions={false}
              />
              {token.status === TokenStatus.CREATED && (
                <Button
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2 font-semibold"
                  onClick={() => {
                    if (isOnlyOneSubQueue) {
                      updateToken({
                        status: TokenStatus.IN_PROGRESS,
                        sub_queue: assignedServicePoints[0]?.id,
                        note: token.note,
                      });
                    } else {
                      onOpenChange(false);
                      setShowServicepointDialog(true);
                    }
                  }}
                >
                  {t("mark_as_in_service")}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {token && !isOnlyOneSubQueue && (
        <AssignToServicePointDialog
          open={showServicepointDialog}
          onOpenChange={setShowServicepointDialog}
          token={token}
          subQueues={assignedServicePoints}
          onUpdate={updateToken}
          isPending={isPending}
        />
      )}
    </>
  );
}
