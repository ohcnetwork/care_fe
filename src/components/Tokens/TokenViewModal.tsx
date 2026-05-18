import { useTranslation } from "react-i18next";

import TokenCardWithButton from "@/components/Tokens/TokenCardWithButton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToken } from "@/hooks/useToken";
import { getTokenStatus } from "@/pages/Facility/queues/utils";
import { FacilityRead } from "@/types/facility/facility";
import { formatScheduleResourceName } from "@/types/scheduling/schedule";
import {
  renderTokenNumber,
  TOKEN_STATUS_COLORS,
} from "@/types/tokens/token/token";

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

  const { token, isPending } = useToken({
    facilityId: facility.id,
    queueId: queueId ?? "",
    tokenId: tokenId ?? "",
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  if (isPending || !token) {
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
              className="print:block print:w-[400px] print:border print:rounded-md bg-white space-y-2 rounded-md"
            >
              <TokenCardWithButton
                token={token}
                facility={facility}
                cardClassName="hover:scale-none"
                tokenActions={false}
                onSuccess={() => onOpenChange(false)}
                onOpenDialogForServicePoint={() => onOpenChange(true)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
