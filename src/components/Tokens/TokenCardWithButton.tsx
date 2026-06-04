import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useToken } from "@/hooks/useToken";
import { ServicepointSelector } from "@/pages/Facility/queues/ServicepointSelector";
import { TokenCard } from "@/pages/Facility/queues/TokenCard";
import { useQueueServicePoints } from "@/pages/Facility/queues/useQueueServicePoints";
import { FacilityRead } from "@/types/facility/facility";
import { TokenRetrieve, TokenStatus } from "@/types/tokens/token/token";
import { ArrowRight } from "lucide-react";

interface TokenCardWithButtonProps {
  token: TokenRetrieve;
  facility: FacilityRead;
  showMarkInServiceButton?: boolean;
  showButtonArrow?: boolean;
  cardClassName?: string;
  tokenActions?: boolean;
  onSuccess?: () => void;
  onOpenDialogForServicePoint?: () => void;
}

export default function TokenCardWithButton({
  token,
  facility,
  showMarkInServiceButton = true,
  showButtonArrow = false,
  cardClassName,
  tokenActions = false,
  onSuccess,
  onOpenDialogForServicePoint,
}: TokenCardWithButtonProps) {
  const { t } = useTranslation();
  const [showServicepointDialog, setShowServicepointDialog] = useState(false);

  const { token: latestToken, updateToken } = useToken({
    facilityId: facility.id,
    queueId: token.queue.id,
    tokenId: token.id,
    onSuccess: () => {
      setShowServicepointDialog(false);
      onSuccess?.();
    },
  });

  const currentToken = latestToken ?? token;

  const { assignedServicePoints } = useQueueServicePoints({
    facilityId: facility.id,
    resourceType: currentToken.resource_type,
    resourceId: currentToken.resource.id,
  });

  const isOnlyOneSubQueue = assignedServicePoints.length === 1;

  return (
    <>
      <TokenCard
        showlogo={false}
        token={currentToken}
        facility={facility}
        id={`token-card-${token.id}`}
        className={cardClassName}
        tokenActions={tokenActions}
      />
      {showMarkInServiceButton &&
        currentToken.status === TokenStatus.CREATED && (
          <Button
            className="w-full flex items-center justify-center gap-2 font-semibold"
            onClick={() => {
              if (isOnlyOneSubQueue) {
                updateToken({
                  status: TokenStatus.IN_PROGRESS,
                  sub_queue: assignedServicePoints[0]?.id,
                  note: currentToken.note,
                });
                return;
              }

              onOpenDialogForServicePoint?.();
              setShowServicepointDialog(true);
            }}
          >
            {t("mark_as_in_service")}
            {showButtonArrow && (
              <ArrowRight className="size-4 animate-arrow-slide" />
            )}
          </Button>
        )}

      {!isOnlyOneSubQueue && showMarkInServiceButton && (
        <ServicepointSelector
          open={showServicepointDialog}
          onOpenChange={setShowServicepointDialog}
          token={currentToken}
          facilityId={facility.id}
          subQueues={assignedServicePoints}
          action="serve"
        />
      )}
    </>
  );
}
