import { useQuery } from "@tanstack/react-query";
import { Hourglass, ReceiptText } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChargeItemServiceResource,
  EXCLUDED_CHARGE_ITEM_STATUSES,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";

import { ServiceRequestCompleteDialog } from "./ServiceRequestCompleteDialog";

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
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
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
        pendingReports={pendingReports}
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
      />
    </>
  );
}
