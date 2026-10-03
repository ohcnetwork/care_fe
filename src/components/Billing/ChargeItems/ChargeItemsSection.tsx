import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayersPlus, ReceiptIndianRupee } from "lucide-react";
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
  ChargeItemRead,
  ChargeItemServiceResource,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";

interface ChargeItemsSectionProps {
  facilityId: string;
  resourceId: string;
  patientId?: string;
  serviceResourceType: ChargeItemServiceResource;
  sourceUrl?: string;
  encounterId?: string;
  disableCreateChargeItems?: boolean;
  disableCreateChargeItemsSection?: boolean;
  viewOnly?: boolean;
  className?: string;
}

export function ChargeItemsSection({
  facilityId,
  resourceId,
  patientId,
  serviceResourceType,
  sourceUrl,
  encounterId,
  disableCreateChargeItems = false,
  disableCreateChargeItemsSection = false,
  viewOnly = false,
  className,
}: ChargeItemsSectionProps) {
  const { t } = useTranslation();
  useShortcutSubContext("facility:appointment");
  const queryClient = useQueryClient();

  const [isMultiAddOpen, setIsMultiAddOpen] = useState(false);
  const [invoiceSheetState, setInvoiceSheetState] = useState<{
    open: boolean;
    chargeItems: ChargeItemRead[];
  }>({
    open: false,
    chargeItems: [],
  });

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

  const billableChargeItems = (chargeItems?.results ?? []).filter(
    (chargeItem) => chargeItem.status === ChargeItemStatus.billable,
  );

  return (
    <>
      <div className={className}>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0 p-0">
          <CardTitle>
            {chargeItems?.count
              ? `${chargeItems.count} ${t("charge_items")}`
              : t("add_charge_item")}
          </CardTitle>
          <div className="contents sm:ml-auto sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
            {!disableCreateChargeItemsSection &&
              !viewOnly &&
              account?.results[0] &&
              isAccountActiveAndBillable(account?.results[0]) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto sm:ml-0"
                  onClick={() => setIsMultiAddOpen(true)}
                >
                  <LayersPlus className="size-4" />
                  {t("add_charge_items")}
                  <ShortcutBadge actionId="add-a-charge-item" />
                </Button>
              )}
            {billableChargeItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto sm:ml-0"
                onClick={() =>
                  setInvoiceSheetState({
                    open: true,
                    chargeItems: billableChargeItems,
                  })
                }
              >
                <ReceiptIndianRupee className="size-4" />
                {t("create_invoice")}
                <ShortcutBadge actionId="create-an-invoice" />
              </Button>
            )}
          </div>
        </CardHeader>
        {chargeItems?.results.map((chargeItem) => (
          <CardContent
            key={chargeItem.id}
            className="divide-y divide-gray-200 p-0 mt-2 bg-white border border-gray-200 rounded-md"
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
      {invoiceSheetState.open && (
        <CreateInvoiceSheet
          facilityId={facilityId}
          accountId={account?.results[0]?.id ?? ""}
          open={invoiceSheetState.open}
          disableCreateChargeItems={disableCreateChargeItems}
          onOpenChange={() =>
            setInvoiceSheetState({ open: false, chargeItems: [] })
          }
          preSelectedChargeItems={invoiceSheetState.chargeItems}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["chargeItems", facilityId, resourceId],
            });
            setInvoiceSheetState({ open: false, chargeItems: [] });
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
