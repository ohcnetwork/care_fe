import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Textarea } from "@/components/ui/textarea";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import {
  ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";

interface CompleteServiceRequestDialogProps {
  facilityId: string;
  serviceRequest: ServiceRequestReadSpec;
}

export function CompleteServiceRequestDialog({
  facilityId,
  serviceRequest,
}: CompleteServiceRequestDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState(serviceRequest.note ?? "");

  const {
    mutate: completeServiceRequest,
    isPending: isCompletingServiceRequest,
  } = useMutation({
    mutationFn: mutate(serviceRequestApi.updateServiceRequest, {
      pathParams: { facilityId, serviceRequestId: serviceRequest.id },
    }),
    onSuccess: () => {
      toast.success(t("service_request_completed"));
      setIsOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId, serviceRequest.id],
      });
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (isCompletingServiceRequest) return;
    setIsOpen(open);
  };

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-white border-gray-300 p-2">
        <div className="flex w-full items-center justify-between px-4 py-3 gap-2 bg-white">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">
              {t("complete_service_request")}
            </p>
            <p className="text-xs text-gray-600">
              {t("complete_service_request_help_text")}
            </p>
          </div>
          <Button
            variant="primary"
            className="font-semibold shrink-0"
            onClick={() => {
              setNote(serviceRequest.note ?? "");
              setIsOpen(true);
            }}
            disabled={isCompletingServiceRequest}
          >
            {t("mark_as_complete")}
            <ShortcutBadge actionId="mark-as-complete" />
          </Button>
        </div>
      </div>

      <ResponsiveDialog
        open={isOpen}
        onOpenChange={handleOpenChange}
        title={t("add_completion_note")}
        description={t("service_request_completion_note_description")}
      >
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900">
            {t("completion_note")}
          </p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("enter_note")}
            className="min-h-14"
            aria-label={t("completion_note")}
          />
        </div>
        <div className="flex flex-row items-start justify-start gap-2 pt-2 sm:pt-0">
          <Button
            variant="primary"
            onClick={() =>
              completeServiceRequest({
                status: Status.completed,
                note: note.trim() || null,
                locations: serviceRequest.locations.map((loc) => loc.id),
              })
            }
            disabled={isCompletingServiceRequest}
          >
            <CheckIcon className="size-4" />
            {isCompletingServiceRequest
              ? t("updating")
              : t("save_and_complete")}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCompletingServiceRequest}
          >
            {t("cancel")}
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  );
}
