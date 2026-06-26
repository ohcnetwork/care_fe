import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useToken } from "@/hooks/useToken";
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
  const [showServicepointDialog, setShowServicepointDialog] = useState(false);

  const { updateToken, isUpdating } = useToken({
    facilityId: facility.id,
    queueId: token.queue.id,
    tokenId: token.id,
    patientId: token.patient?.id,
    onSuccess: () => {
      setShowServicepointDialog(false);
      toast(t("token_assigned_to_service_point"));
      onSuccess?.();
    },
  });

  const { assignedServicePoints, isServicePointsLoading } =
    useQueueServicePoints({
      facilityId: facility.id,
      resourceType: token.resource_type,
      resourceId: token.resource.id,
    });

  const isOnlyOneSubQueue =
    !isServicePointsLoading && assignedServicePoints.length === 1;

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
              setShowServicepointDialog(true);
            }}
            variant="outline_primary"
            disabled={isUpdating || isServicePointsLoading}
          >
            {t("mark_as_in_service")}
          </Button>
        </div>
      )}

      {!isOnlyOneSubQueue && showMarkInServiceButton && (
        <ServicePointSelector
          open={showServicepointDialog}
          onOpenChange={setShowServicepointDialog}
          token={token}
          facilityId={facility.id}
          subQueues={assignedServicePoints}
          action="serve"
          onSuccess={() => {
            setShowServicepointDialog(false);
            toast.success(t("token_assigned_to_service_point"));
            onSuccess?.();
          }}
        />
      )}
    </>
  );
}
