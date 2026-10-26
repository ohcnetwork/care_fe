import CareIcon from "@/CAREUI/icons/CareIcon";
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
import { ArrowLeft } from "lucide-react";
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
      <BackButton
        variant="outline"
        className="font-semibold border border-gray-400 text-gray-950 underline underline-offset-2"
      >
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
                  className="border-gray-400 px-2"
                  aria-label={t("more_actions")}
                  disabled={isCancellingServiceRequest}
                >
                  <CareIcon icon="l-ellipsis-v" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild className="text-primary-900">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      cancelServiceRequest({
                        status: Status.entered_in_error,
                      })
                    }
                    className="w-full flex flex-row "
                  >
                    <CareIcon icon="l-exclamation-circle" className="mr-1" />
                    <span>{t("mark_as_entered_in_error")}</span>
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-primary-900">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      cancelServiceRequest({
                        status: Status.revoked,
                      })
                    }
                    className="w-full flex flex-row justify-stretch items-center"
                  >
                    <CareIcon icon="l-ban" className="mr-1" />
                    {t("mark_as_revoked")}
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
      </div>
    </div>
  );
}
