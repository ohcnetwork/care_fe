import BackButton from "@/components/Common/BackButton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, CircleAlert, MoreVertical } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
                navigate(
                  `/facility/${facilityId}/patient/${request.encounter.patient.id}/service_request/${serviceRequestId}/diagnostic_reports/print`,
                )
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
    </div>
  );
}
