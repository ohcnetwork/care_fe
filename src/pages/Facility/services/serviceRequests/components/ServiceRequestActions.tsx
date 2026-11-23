import BackButton from "@/components/Common/BackButton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navigate } from "@/lib/router/navigate";
import {
  EDITABLE_SERVICE_REQUEST_STATUSES,
  ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  CircleAlert,
  CircleCheck,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ServiceRequestCompleteDialog } from "./ServiceRequestCompleteDialog";

interface ServiceRequestActionsProps {
  request: ServiceRequestReadSpec;
  facilityId: string;
  serviceRequestId: string;
  hasFinalizedReport: boolean;
}

export function ServiceRequestActions({
  request,
  facilityId,
  serviceRequestId,
  hasFinalizedReport,
}: ServiceRequestActionsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const canComplete = EDITABLE_SERVICE_REQUEST_STATUSES.includes(
    request.status,
  );
  const {
    mutate: cancelServiceRequest,
    isPending: isCancellingServiceRequest,
  } = useMutation({
    mutationFn: mutate(serviceRequestApi.cancelServiceRequest, {
      pathParams: { facilityId, serviceRequestId },
    }),
    onSuccess: () => {
      toast.success(t("service_request_cancelled"));
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId, serviceRequestId],
      });
    },
  });

  return (
    <div className="flex items-center justify-between gap-2">
      <BackButton variant="outline">
        <ArrowLeft />
        {t("back")}
      </BackButton>

      <div className="flex items-end gap-2">
        {hasFinalizedReport && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              className="font-semibold"
              onClick={() =>
                navigate({
                  to: "/facility/$facilityId/patient/$patientId/service_request/$serviceRequestId/diagnostic_reports/print",
                  params: {
                    facilityId,
                    patientId: request.encounter.patient.id,
                    serviceRequestId,
                  },
                })
              }
            >
              {t("view_full_report")}
              <ShortcutBadge actionId="view-report" />
            </Button>
          </div>
        )}
        {request.status !== Status.completed &&
          request.status !== Status.revoked && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-input px-2"
                  aria-label={t("more_actions")}
                  disabled={isCancellingServiceRequest}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canComplete && (
                  <DropdownMenuItem
                    onSelect={() => setIsCompleteDialogOpen(true)}
                  >
                    <CircleCheck className="size-4" />
                    {t("mark_as_complete")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={() =>
                    cancelServiceRequest({ status: Status.entered_in_error })
                  }
                >
                  <CircleAlert className="size-4" />
                  {t("mark_as_entered_in_error")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    cancelServiceRequest({ status: Status.revoked })
                  }
                >
                  <Ban className="size-4" />
                  {t("mark_as_revoked")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
      </div>
      {canComplete && (
        <ServiceRequestCompleteDialog
          request={request}
          facilityId={facilityId}
          serviceRequestId={serviceRequestId}
          open={isCompleteDialogOpen}
          onOpenChange={setIsCompleteDialogOpen}
        />
      )}
    </div>
  );
}
