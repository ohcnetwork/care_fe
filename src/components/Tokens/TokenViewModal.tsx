import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ServicepointDialog } from "@/pages/Facility/queues/ServicepointDialog";
import { TokenCard } from "@/pages/Facility/queues/TokenCard";
import { FacilityRead } from "@/types/facility/facility";
import { formatScheduleResourceName } from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import {
  renderTokenNumber,
  TOKEN_STATUS_COLORS,
  TokenRetrieve,
  TokenStatus,
} from "@/types/tokens/token/token";
import query from "@/Utils/request/query";

interface TokenViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  facility: FacilityRead;
  tokenId: string;
}

export default function TokenViewModal({
  open,
  onOpenChange,
  patientId,
  facility,
  tokenId,
}: TokenViewModalProps) {
  const { t } = useTranslation();
  const [showServicepointDialog, setShowServicepointDialog] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tokens", patientId, facility.id],
    queryFn: query(scheduleApis.appointments.get_tokens, {
      pathParams: { patientId },
      queryParams: {
        facility: facility.id,
        limit: 50,
      },
    }),
  });

  const token = data?.results?.find((t) => t.id === tokenId);

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
                {t(token.status.toLowerCase())}
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
                    setShowServicepointDialog(true);
                    onOpenChange(false);
                  }}
                >
                  {t("mark_as_in_service")}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {token && (
        <ServicepointDialog
          open={showServicepointDialog}
          onOpenChange={setShowServicepointDialog}
          token={token}
          facilityId={facility.id}
          resourceType={token.resource_type}
          resourceId={token.resource.id}
        />
      )}
    </>
  );
}
