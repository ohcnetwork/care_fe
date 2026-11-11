import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import useBreakpoints from "@/hooks/useBreakpoints";
import {
  ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";

interface ServiceRequestCompletionProps {
  request: ServiceRequestReadSpec;
  facilityId: string;
  serviceRequestId: string;
  pendingReports: number;
  totalReports: number;
}

export function ServiceRequestCompletion({
  request,
  facilityId,
  serviceRequestId,
  pendingReports,
  totalReports,
}: ServiceRequestCompletionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isMobile = useBreakpoints({ default: true, lg: false });
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const hasPendingReports = pendingReports > 0;
  const {
    mutate: completeServiceRequest,
    isPending: isCompletingServiceRequest,
  } = useMutation({
    mutationFn: mutate(serviceRequestApi.updateServiceRequest, {
      pathParams: { facilityId, serviceRequestId },
    }),
    onSuccess: () => {
      toast.success(t("service_request_completed"));
      setIsCompleteDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId, serviceRequestId],
      });
    },
  });

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-white border-gray-300 p-2">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3 gap-2 bg-white">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">
              {t("complete_service_request")}
            </p>
            <p className="text-xs text-gray-600">
              {hasPendingReports
                ? t("reports_pending_final_review", {
                    count: pendingReports,
                    total: totalReports,
                  })
                : t("complete_service_request_help_text")}
            </p>
          </div>
          <Button
            variant="primary"
            className="font-semibold shrink-0"
            onClick={() => {
              setCompletionNote(request.note ?? "");
              setIsCompleteDialogOpen(true);
            }}
            disabled={isCompletingServiceRequest || hasPendingReports}
          >
            {t("mark_as_complete")}
            <ShortcutBadge actionId="mark-as-complete" />
          </Button>
        </div>
      </div>

      {isMobile ? (
        <Sheet
          open={isCompleteDialogOpen}
          onOpenChange={(open) => {
            if (!isCompletingServiceRequest) setIsCompleteDialogOpen(open);
          }}
        >
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>{t("add_completion_note")}</SheetTitle>
              <SheetDescription>
                {t("service_request_completion_note_description")}
              </SheetDescription>
            </SheetHeader>
            <CompletionNoteContent
              note={completionNote}
              isUpdating={isCompletingServiceRequest}
              onNoteChange={setCompletionNote}
              onComplete={() =>
                completeServiceRequest({
                  status: Status.completed,
                  note: completionNote.trim() || null,
                  locations: request.locations.map((loc) => loc.id),
                })
              }
              onCancel={() => setIsCompleteDialogOpen(false)}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog
          open={isCompleteDialogOpen}
          onOpenChange={(open) => {
            if (!isCompletingServiceRequest) setIsCompleteDialogOpen(open);
          }}
        >
          <DialogContent className="sm:max-w-lg shadow-lg border-white/20">
            <DialogHeader>
              <DialogTitle>{t("add_completion_note")}</DialogTitle>
              <DialogDescription>
                {t("service_request_completion_note_description")}
              </DialogDescription>
            </DialogHeader>
            <CompletionNoteContent
              note={completionNote}
              isUpdating={isCompletingServiceRequest}
              onNoteChange={setCompletionNote}
              onComplete={() =>
                completeServiceRequest({
                  status: Status.completed,
                  note: completionNote.trim() || null,
                  locations: request.locations.map((loc) => loc.id),
                })
              }
              onCancel={() => setIsCompleteDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

interface CompletionNoteContentProps {
  note: string;
  isUpdating: boolean;
  onNoteChange: (note: string) => void;
  onComplete: () => void;
  onCancel: () => void;
}

const CompletionNoteContent = ({
  note,
  isUpdating,
  onNoteChange,
  onComplete,
  onCancel,
}: CompletionNoteContentProps) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-900">
          {t("completion_note")}
        </p>
        <Textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={t("enter_note")}
          className="min-h-14"
          aria-label={t("completion_note")}
        />
      </div>
      <div className="flex flex-row items-start justify-start gap-2 pt-2 sm:pt-0">
        <Button variant="primary" onClick={onComplete} disabled={isUpdating}>
          <CheckIcon className="size-4" />
          {isUpdating ? t("updating") : `${t("save_and_complete")}`}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isUpdating}>
          {t("cancel")}
        </Button>
      </div>
    </>
  );
};
