import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import mutate from "@/Utils/request/mutate";

interface ServiceRequestCompleteDialogProps {
  request: ServiceRequestReadSpec;
  facilityId: string;
  serviceRequestId: string;
  pendingReports: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceRequestCompleteDialog({
  request,
  facilityId,
  serviceRequestId,
  pendingReports,
  open,
  onOpenChange,
}: ServiceRequestCompleteDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [note, setNote] = useState(request.note ?? "");
  const isMobile = useBreakpoints({ default: true, lg: false });
  const { mutate: completeServiceRequest, isPending } = useMutation({
    mutationFn: mutate(serviceRequestApi.updateServiceRequest, {
      pathParams: { facilityId, serviceRequestId },
    }),
    onSuccess: () => {
      toast.success(t("service_request_completed"));
      onOpenChange(false);
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId, serviceRequestId],
      });
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isPending) onOpenChange(nextOpen);
    if (!nextOpen) setNote(request.note ?? "");
  };

  const content = (
    <>
      {pendingReports > 0 && (
        <Alert
          role="note"
          className="border-yellow-200 bg-yellow-50 text-yellow-900"
        >
          <TriangleAlert className="text-yellow-600" />
          <AlertTitle>
            {t("pending_final_review_reports", { count: pendingReports })}
          </AlertTitle>
          <AlertDescription className="text-yellow-800">
            {t("service_request_complete_pending_reports_warning")}
          </AlertDescription>
        </Alert>
      )}
      <CompletionNoteContent
        note={note}
        setNote={setNote}
        isUpdating={isPending}
        onComplete={(note) =>
          completeServiceRequest({
            status: Status.completed,
            note: note.trim() || null,
            locations: request.locations.map((loc) => loc.id),
          })
        }
        onCancel={() => handleOpenChange(false)}
      />
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t("add_completion_note")}</SheetTitle>
            <SheetDescription>
              {t("service_request_completion_note_description")}
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg shadow-lg border-white/20">
        <DialogHeader>
          <DialogTitle>{t("add_completion_note")}</DialogTitle>
          <DialogDescription>
            {t("service_request_completion_note_description")}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

interface CompletionNoteContentProps {
  note: string;
  setNote: (note: string) => void;
  isUpdating: boolean;
  onComplete: (note: string) => void;
  onCancel: () => void;
}

// Mounted only while the dialog is open, so the note resets on each open
const CompletionNoteContent = ({
  note,
  setNote,
  isUpdating,
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
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("enter_note")}
          className="min-h-14"
          aria-label={t("completion_note")}
        />
      </div>
      <div className="flex flex-row items-start justify-start gap-2 pt-2 sm:pt-0">
        <Button
          variant="primary"
          onClick={() => onComplete(note)}
          disabled={isUpdating}
        >
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
