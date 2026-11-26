import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

import { ServiceRequestCompleteDialog } from "./ServiceRequestCompleteDialog";

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
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const hasPendingReports = pendingReports > 0;

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-background border-border p-2">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3 gap-2 bg-background">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {t("complete_service_request")}
            </p>
            <p className="text-xs text-muted-foreground">
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
            onClick={() => setIsCompleteDialogOpen(true)}
            disabled={hasPendingReports}
          >
            {t("mark_as_complete")}
            <ShortcutBadge actionId="mark-as-complete" />
          </Button>
        </div>
      </div>

      <ServiceRequestCompleteDialog
        request={request}
        facilityId={facilityId}
        serviceRequestId={serviceRequestId}
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
      />
    </>
  );
}
