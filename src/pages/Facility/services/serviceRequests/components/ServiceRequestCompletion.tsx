import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Hourglass, ReceiptText } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  ChargeItemServiceResource,
  EXCLUDED_CHARGE_ITEM_STATUSES,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import {
  ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface ServiceRequestCompletionProps {
  request: ServiceRequestReadSpec;
  facilityId: string;
  serviceRequestId: string;
  pendingReports: number;
  totalReports: number;
  collectedSpecimens: number;
  totalSpecimens: number;
}

export function ServiceRequestCompletion({
  request,
  facilityId,
  serviceRequestId,
  pendingReports,
  totalReports,
  collectedSpecimens,
  totalSpecimens,
}: ServiceRequestCompletionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isMobile = useBreakpoints({ default: true, lg: false });
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const hasPendingReports = pendingReports > 0;

  // Same query as the charge items section, so it is served from the cache
  const { data: chargeItems } = useQuery({
    queryKey: ["chargeItems", facilityId, request.id],
    queryFn: query(chargeItemApi.listChargeItem, {
      pathParams: { facilityId },
      queryParams: {
        service_resource: ChargeItemServiceResource.service_request,
        service_resource_id: request.id,
      },
    }),
  });
  const unpaidChargeItems = (chargeItems?.results ?? []).filter(
    (chargeItem) =>
      !EXCLUDED_CHARGE_ITEM_STATUSES.includes(chargeItem.status) &&
      chargeItem.paid_invoice?.status !== InvoiceStatus.balanced,
  ).length;

  const pendingItems = [
    hasPendingReports && {
      key: "reports",
      Icon: Hourglass,
      label: t("reports_pending_final_review", {
        count: pendingReports,
        total: totalReports,
      }),
    },
    collectedSpecimens < totalSpecimens && {
      key: "specimens",
      Icon: Hourglass,
      label: t("specimens_collected_of_total", {
        collected: collectedSpecimens,
        total: totalSpecimens,
      }),
    },
    unpaidChargeItems > 0 && {
      key: "charge_items",
      Icon: ReceiptText,
      label: t("unpaid_charge_items", { count: unpaidChargeItems }),
    },
  ].filter((item) => !!item);
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
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-white">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-2.5 @7xl:max-w-7xl">
          <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
            <p className="text-sm font-semibold text-foreground">
              {t("complete_service_request")}
            </p>
            {pendingItems.length > 0 ? (
              <ul className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-soft-foreground">
                {pendingItems.map(({ key, Icon, label }, index) => (
                  <li
                    key={key}
                    // Phones show only what blocks completion first
                    className={cn(
                      "flex items-center gap-1.5",
                      index > 0 && "hidden sm:flex",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                    {label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-soft-foreground">
                {t("complete_service_request_help_text")}
              </p>
            )}
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
          <SheetContent side="bottom" className="overflow-hidden">
            <SheetHeader>
              <SheetTitle>{t("add_completion_note")}</SheetTitle>
              <SheetDescription>
                {t("service_request_completion_note_description")}
              </SheetDescription>
            </SheetHeader>
            <SheetBody>
              <div className="space-y-4">
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
              </div>
            </SheetBody>
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
