import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LayersPlus, ReceiptText } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CreateInvoiceSheet } from "@/pages/Facility/billing/account/components/CreateInvoiceSheet";
import AddMultipleChargeItemsSheet from "@/pages/Facility/services/serviceRequests/components/AddMultipleChargeItemsSheet";
import { ChargeItemCard } from "@/pages/Facility/services/serviceRequests/components/ChargeItemCard";

import { isAccountActiveAndBillable } from "@/pages/Facility/billing/account/utils";
import { ResourceCategorySubType } from "@/types/base/resourceCategory/resourceCategory";
import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import {
  ChargeItemServiceResource,
  ChargeItemStatus,
  EXCLUDED_CHARGE_ITEM_STATUSES,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import { add } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";

interface ChargeItemsSectionProps {
  facilityId: string;
  resourceId: string;
  patientId?: string;
  serviceResourceType: ChargeItemServiceResource;
  sourceUrl?: string;
  encounterId?: string;
  viewOnly?: boolean;
  /** One summary line (count, total, payment) that expands to the items. */
  compact?: boolean;
  className?: string;
}

export function ChargeItemsSection({
  facilityId,
  resourceId,
  patientId,
  serviceResourceType,
  sourceUrl,
  encounterId,
  viewOnly = false,
  compact = false,
  className,
}: ChargeItemsSectionProps) {
  const { t } = useTranslation();
  useShortcutSubContext("facility:appointment");
  const queryClient = useQueryClient();

  const [isMultiAddOpen, setIsMultiAddOpen] = useState(false);
  const [isInvoiceSheetOpen, setIsInvoiceSheetOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: chargeItems } = useQuery({
    queryKey: ["chargeItems", facilityId, resourceId],
    queryFn: query(chargeItemApi.listChargeItem, {
      pathParams: {
        facilityId: facilityId,
      },
      queryParams: {
        service_resource: serviceResourceType,
        service_resource_id: resourceId,
      },
    }),
    enabled: !!resourceId,
  });

  const { data: account } = useQuery({
    queryKey: ["accounts", patientId],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patientId,
        limit: 1,
        offset: 0,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
      },
    }),
    enabled: Boolean(patientId),
  });

  if (viewOnly && chargeItems?.results.length === 0) {
    return null;
  }

  const items = chargeItems?.results ?? [];
  const billableChargeItems = items.filter(
    (chargeItem) => chargeItem.status === ChargeItemStatus.billable,
  );
  // The compact total leaves out cancelled items, and shows only once every
  // item is loaded.
  const countedItems = items.filter(
    ({ status }) => !EXCLUDED_CHARGE_ITEM_STATUSES.includes(status),
  );
  const unpaidCount = countedItems.filter(
    (chargeItem) => chargeItem.paid_invoice?.status !== InvoiceStatus.balanced,
  ).length;
  const showTotal =
    countedItems.length > 0 && chargeItems?.count === items.length;

  // The compact line keeps both buttons labelled; narrow screens give them
  // their own row (stacked on the narrowest) and drop the keyboard hints.
  const shortcutClass = compact ? "@max-md:hidden" : undefined;
  const actions = (
    <div
      className={
        compact
          ? "grid w-full gap-2 @xs:auto-cols-fr @xs:grid-flow-col @md:ml-auto @md:flex @md:w-auto"
          : "contents sm:ml-auto sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-2"
      }
    >
      {!viewOnly &&
        account?.results[0] &&
        isAccountActiveAndBillable(account?.results[0]) && (
          <Button
            variant="outline"
            size={compact ? "default" : "sm"}
            className={cn(!compact && "ml-auto sm:ml-0")}
            onClick={() => setIsMultiAddOpen(true)}
          >
            <LayersPlus className="size-4" />
            {t("add_charge_items")}
            <ShortcutBadge
              actionId="add-a-charge-item"
              className={shortcutClass}
            />
          </Button>
        )}
      {billableChargeItems.length > 0 && (
        <Button
          variant="outline"
          size={compact ? "default" : "sm"}
          className={cn(!compact && "ml-auto sm:ml-0")}
          onClick={() => setIsInvoiceSheetOpen(true)}
        >
          <ReceiptText className="size-4" />
          {t("create_invoice")}
          <ShortcutBadge
            actionId="create-an-invoice"
            className={shortcutClass}
          />
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className={cn("@container", className)}>
        {compact ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {chargeItems?.count ? (
              <button
                type="button"
                className="-ml-1 flex items-center gap-1 rounded-md px-1 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
              >
                <ChevronDown
                  className={cn(
                    "size-4 text-soft-foreground transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
                {t("charge_items", { count: chargeItems.count })}
              </button>
            ) : (
              <span className="text-sm font-semibold text-foreground">
                {t("add_charge_item")}
              </span>
            )}
            {showTotal && (
              <>
                <span className="text-sm font-semibold text-foreground">
                  <MonetaryDisplay
                    amount={add(
                      ...countedItems.map(({ total_price }) => total_price),
                    )}
                  />
                </span>
                {unpaidCount > 0 ? (
                  <Badge variant="destructive">
                    {t("charge_items_unpaid_count", { count: unpaidCount })}
                  </Badge>
                ) : (
                  <Badge variant="green">{t("paid")}</Badge>
                )}
              </>
            )}
            {actions}
          </div>
        ) : (
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0 p-0">
            <CardTitle>
              {chargeItems?.count
                ? t("charge_items", { count: chargeItems.count })
                : t("add_charge_item")}
            </CardTitle>
            {actions}
          </CardHeader>
        )}
        {(!compact || isExpanded) &&
          chargeItems?.results.map((chargeItem) => (
            <CardContent
              key={chargeItem.id}
              className="divide-y divide-border p-0 mt-2 bg-white border border-border rounded-md"
            >
              <ChargeItemCard
                key={chargeItem.id}
                chargeItem={chargeItem}
                sourceUrl={sourceUrl}
              />
            </CardContent>
          ))}
      </div>

      {/* Add the sheets for invoice creation and charge items */}
      {isInvoiceSheetOpen && (
        <CreateInvoiceSheet
          facilityId={facilityId}
          accountId={account?.results[0]?.id ?? ""}
          open={isInvoiceSheetOpen}
          onOpenChange={() => setIsInvoiceSheetOpen(false)}
          scope={{
            kind: "service_resource",
            serviceResource: serviceResourceType,
            serviceResourceId: resourceId,
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["chargeItems", facilityId, resourceId],
            });
            setIsInvoiceSheetOpen(false);
          }}
          sourceUrl={sourceUrl}
        />
      )}
      {account?.results[0]?.id && (
        <AddMultipleChargeItemsSheet
          open={isMultiAddOpen}
          onOpenChange={setIsMultiAddOpen}
          facilityId={facilityId}
          serviceResourceId={resourceId}
          patientId={patientId}
          encounterId={encounterId}
          serviceResourceType={serviceResourceType}
          onChargeItemsAdded={() => {
            queryClient.invalidateQueries({
              queryKey: ["chargeItems", facilityId, resourceId],
            });
          }}
          resourceSubType={ResourceCategorySubType.other}
          accountId={account?.results[0]?.id}
        />
      )}
    </>
  );
}
