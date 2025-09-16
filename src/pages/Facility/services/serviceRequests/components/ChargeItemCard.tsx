import { t } from "i18next";
import { ExternalLink, InfoIcon } from "lucide-react";
import { navigate } from "raviger";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import ChargeItemPriceDisplay from "@/components/Billing/ChargeItem/ChargeItemPriceDisplay";

import { MonetaryDisplay } from "@/components/ui/monetary-display";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  CHARGE_ITEM_STATUS_COLORS,
  ChargeItemRead,
  ChargeItemServiceResource,
} from "@/types/billing/chargeItem/chargeItem";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";

interface ChargeItemCardProps {
  chargeItem: ChargeItemRead;
  serviceResourceId: string;
  serviceResourceType: ChargeItemServiceResource;
  locationId?: string;
  patientId?: string;
}

export function ChargeItemCard({
  chargeItem,
  serviceResourceId,
  serviceResourceType,
  locationId,
  patientId,
}: ChargeItemCardProps) {
  const isPaid = chargeItem.paid_invoice?.status === InvoiceStatus.balanced;
  const { facilityId } = useCurrentFacility();
  const invoiceUrl = chargeItem.paid_invoice
    ? `/facility/${facilityId}/billing/invoices/${chargeItem.paid_invoice.id}?sourceUrl=/facility/${facilityId}/${locationId ? `locations/${locationId}/` : ""}${patientId ? `patient/${patientId}/` : ""}${serviceResourceType === ChargeItemServiceResource.service_request ? "service_requests/" : "appointments/"}${serviceResourceId}`
    : null;

  return (
    <Card className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <div className="flex flex-row sm:items-center gap-2 sm:gap-2 text-sm text-gray-600">
            <span className="text-base sm:text-base text-gray-950 font-medium truncate">
              {chargeItem.title}
            </span>
            <div className="flex items-center gap-2">
              {Number(chargeItem.quantity) > 1 && (
                <span className="text-sm text-gray-950 whitespace-nowrap">
                  {t("x")} {chargeItem.quantity}
                </span>
              )}
              <Badge variant={CHARGE_ITEM_STATUS_COLORS[chargeItem.status]}>
                {t(chargeItem.status)}
              </Badge>
            </div>
          </div>
          <div className="font-semibold flex items-center mt-1">
            <span>
              <MonetaryDisplay amount={chargeItem.total_price} />
            </span>
            {chargeItem.total_price_components?.length > 0 && (
              <Popover>
                <PopoverTrigger>
                  <InfoIcon className="size-4 text-gray-700 cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent side="right" className="p-0">
                  <ChargeItemPriceDisplay
                    priceComponents={chargeItem.total_price_components}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        <div className="flex flex-row sm:flex-col sm:items-end gap-2 sm:gap-1">
          <div className="text-sm text-gray-600 sm:text-right">
            {t("payment_status")}:
          </div>
          <div
            onClick={() => {
              invoiceUrl && navigate(invoiceUrl);
            }}
            className={cn(
              "inline-flex items-center cursor-pointer",
              !invoiceUrl && "pointer-events-none",
            )}
          >
            <Badge variant={isPaid ? "green" : "destructive"}>
              {isPaid ? t("paid") : t("unpaid")}
            </Badge>
            {invoiceUrl && <ExternalLink className="size-4 ml-1" />}
          </div>
        </div>
      </div>
    </Card>
  );
}
