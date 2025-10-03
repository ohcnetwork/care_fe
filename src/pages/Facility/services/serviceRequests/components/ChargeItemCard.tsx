import { t } from "i18next";
import { InfoIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import ChargeItemPriceDisplay from "@/components/Billing/ChargeItem/ChargeItemPriceDisplay";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { Button } from "@/components/ui/button";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  CHARGE_ITEM_STATUS_COLORS,
  ChargeItemRead,
  ChargeItemServiceResource,
} from "@/types/billing/chargeItem/chargeItem";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import { Link } from "raviger";
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
    <Card className="py-1 px-2 space-y-3 sm:space-y-4 bg-gray-50 rounded-sm shadow-none">
      <div className="flex flex-col md:flex-row sm:justify-between  gap-3 sm:gap-0">
        <div className="flex flex-row min-w-0">
          <div className="flex flex-row items-center gap-2 sm:gap-2 text-sm text-gray-600">
            <span className="text-sm text-gray-950 font-medium truncate">
              {chargeItem.title}
            </span>
            <div className="flex items-center gap-2">
              {Number(chargeItem.quantity) > 1 && (
                <span className="text-sm text-gray-950 whitespace-nowrap">
                  {t("x")} {chargeItem.quantity}
                </span>
              )}
            </div>
          </div>
        </div>
        <div
          className={cn(
            "items-center cursor-pointer flex flex-row gap-2 sm:gap-1",
            !invoiceUrl && "pointer-events-none",
          )}
        >
          <div className="font-semibold text-sm flex items-center">
            <span className="items-center">
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
          {invoiceUrl ? (
            <Button asChild variant="outline" size="xs">
              <Link href={invoiceUrl}>
                {t("invoice")}
                <CareIcon icon="l-external-link-alt" className="size-6" />
              </Link>
            </Button>
          ) : (
            <Badge variant={CHARGE_ITEM_STATUS_COLORS[chargeItem.status]}>
              {t(chargeItem.status)}
            </Badge>
          )}
          <Badge variant={isPaid ? "green" : "destructive"}>
            {isPaid ? t("paid") : t("unpaid")}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
