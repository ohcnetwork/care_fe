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
  SheetBody,
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceRequestCompleteDialog({
  request,
  facilityId,
  serviceRequestId,
  open,
  onOpenChange,
}: ServiceRequestCompleteDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
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
  };
  // Held here so swapping sheet and dialog at lg keeps it; reset on each open.
  const [note, setNote] = useState(request.note ?? "");
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setNote(request.note ?? "");
  }

  const content = (
    <CompletionNoteContent
      note={note}
      onNoteChange={setNote}
      isUpdating={isPending}
      onComplete={() =>
        completeServiceRequest({
          status: Status.completed,
          note: note.trim() || null,
          locations: request.locations.map((loc) => loc.id),
        })
      }
      onCancel={() => handleOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="overflow-hidden">
          <SheetHeader>
            <SheetTitle>{t("add_completion_note")}</SheetTitle>
            <SheetDescription>
              {t("service_request_completion_note_description")}
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <div className="space-y-4">{content}</div>
          </SheetBody>
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
  onNoteChange: (note: string) => void;
  isUpdating: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

const CompletionNoteContent = ({
  note,
  onNoteChange,
  isUpdating,
  onComplete,
  onCancel,
}: CompletionNoteContentProps) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
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
