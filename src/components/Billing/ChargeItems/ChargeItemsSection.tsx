import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CreateInvoiceSheet } from "@/pages/Facility/billing/account/components/CreateInvoiceSheet";
import AddMultipleChargeItemsSheet from "@/pages/Facility/services/serviceRequests/components/AddMultipleChargeItemsSheet";
import { ChargeItemCard } from "@/pages/Facility/services/serviceRequests/components/ChargeItemCard";

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
  locationId?: string;
  viewOnly?: boolean;
}

export function ChargeItemsSection({
  facilityId,
  resourceId,
  patientId,
  serviceResourceType,
  sourceUrl,
  encounterId,
  disableCreateChargeItems = false,
  locationId,
  viewOnly = false,
}: ChargeItemsSectionProps) {
  const { t } = useTranslation();
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

  return (
    <>
      <Card className="bg-white shadow-sm rounded-md p-1">
        <CardHeader className="p-2 bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle>{t("charge_items")}</CardTitle>
            <div className="flex items-center gap-2">
              {(chargeItems?.results ?? []).filter(
                (chargeItem) => chargeItem.status === ChargeItemStatus.billable,
              ).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setInvoiceSheetState({
                      open: true,
                      chargeItems:
                        chargeItems?.results.filter(
                          (chargeItem) =>
                            chargeItem.status === ChargeItemStatus.billable,
                        ) ?? [],
                    })
                  }
                >
                  <PlusIcon className="size-4 mr-2" />
                  {t("create_invoice")}
                  <ShortcutBadge actionId="create-invoice" />
                </Button>
              )}
              {!disableCreateChargeItems && !viewOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMultiAddOpen(true)}
                >
                  <PlusIcon className="size-4 mr-2" />
                  {t("add_charge_items")}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-2 px-1">
          {chargeItems?.results.map((chargeItem) => (
            <ChargeItemCard
              key={chargeItem.id}
              chargeItem={chargeItem}
              serviceResourceId={resourceId}
              serviceResourceType={serviceResourceType}
              locationId={locationId}
              patientId={patientId}
            />
          ))}
        </CardContent>
      </Card>

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
      />
    </>
  );
}
