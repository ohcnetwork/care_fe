import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUpdateToken } from "@/hooks/useUpdateToken";
import { ServicePointSelector } from "@/pages/Facility/queues/ServicePointSelector";
import { TokenCard } from "@/pages/Facility/queues/TokenCard";
import { useQueueServicePoints } from "@/pages/Facility/queues/useQueueServicePoints";
import { FacilityRead } from "@/types/facility/facility";
import { TokenRetrieve, TokenStatus } from "@/types/tokens/token/token";
import { toast } from "sonner";

interface TokenCardWithButtonProps {
  token: TokenRetrieve;
  facility: FacilityRead;
  showMarkInServiceButton?: boolean;
  cardClassName?: string;
  tokenActions?: boolean;
  onSuccess?: () => void;
  onOpenDialogForServicePoint?: () => void;
}

export default function TokenCardWithButton({
  token,
  facility,
  showMarkInServiceButton = true,
  cardClassName,
  tokenActions = false,
  onSuccess,
  onOpenDialogForServicePoint,
}: TokenCardWithButtonProps) {
  const { t } = useTranslation();
  const [showServicePointDialog, setShowServicePointDialog] = useState(false);

  const { mutate: updateToken, isPending: isUpdating } = useUpdateToken({
    facilityId: facility.id,
    token,
    onSuccess: () => {
      setShowServicePointDialog(false);
      toast(t("token_assigned_to_service_point"));
      onSuccess?.();
    },
  });

  const { assignedServicePoints, isServicePointsLoading } =
    useQueueServicePoints({
      facilityId: facility.id,
      resourceType: token.resource_type,
      resourceId: token.resource.id,
      enabled: showMarkInServiceButton && token.status === TokenStatus.CREATED,
    });

  const isOnlyOneSubQueue =
    !isServicePointsLoading && assignedServicePoints.length === 1;

  const hasNoAssignedServicePoints =
    !isServicePointsLoading && assignedServicePoints.length === 0;

  return (
    <>
      <TokenCard
        showlogo={false}
        token={token}
        facility={facility}
        id={`token-card-${token.id}`}
        className={cardClassName}
        tokenActions={tokenActions}
      />
      {showMarkInServiceButton && token.status === TokenStatus.CREATED && (
        <div className="flex w-full items-center justify-center bg-white p-3 rounded-md -mt-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="w-full"
                tabIndex={hasNoAssignedServicePoints ? 0 : undefined}
              >
                <Button
                  className="w-full flex items-center justify-center gap-2 font-semibold"
                  onClick={() => {
                    if (isOnlyOneSubQueue) {
                      updateToken({
                        status: TokenStatus.IN_PROGRESS,
                        sub_queue: assignedServicePoints[0].id,
                        note: token.note,
                      });
                      return;
                    }

                    onOpenDialogForServicePoint?.();
                    setShowServicePointDialog(true);
                  }}
                  variant="outline_primary"
                  disabled={
                    isUpdating ||
                    isServicePointsLoading ||
                    hasNoAssignedServicePoints
                  }
                >
                  {t("mark_as_in_service")}
                </Button>
              </span>
            </TooltipTrigger>
            {hasNoAssignedServicePoints && (
              <TooltipContent>
                {t("no_service_points_are_present")}
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      )}

      {!isOnlyOneSubQueue && showMarkInServiceButton && (
        <ServicePointSelector
          open={showServicePointDialog}
          onOpenChange={setShowServicePointDialog}
          token={token}
          facilityId={facility.id}
          subQueues={assignedServicePoints}
          action="serve"
          onSuccess={() => {
            setShowServicePointDialog(false);
            toast(t("token_assigned_to_service_point"));
            onSuccess?.();
          }}
        />
      )}
    </>
  );
}
