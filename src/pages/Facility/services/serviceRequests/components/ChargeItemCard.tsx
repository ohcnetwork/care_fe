import { t } from "i18next";
import { InfoIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
} from "@/types/billing/chargeItem/chargeItem";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import { isGreaterThan, round } from "@/Utils/decimal";
import { navigate } from "raviger";
interface ChargeItemCardProps {
  chargeItem: ChargeItemRead;
  sourceUrl?: string;
}

export function ChargeItemCard({ chargeItem, sourceUrl }: ChargeItemCardProps) {
  const isPaid = chargeItem.paid_invoice?.status === InvoiceStatus.balanced;
  const { facilityId } = useCurrentFacility();
  const invoiceUrl = chargeItem.paid_invoice
    ? `/facility/${facilityId}/billing/invoices/${chargeItem.paid_invoice.id}?sourceUrl=${sourceUrl}`
    : null;

  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex min-w-0 flex-row items-center gap-2 text-sm text-gray-600">
        <span className="text-sm text-gray-950 font-medium text-wrap">
          {chargeItem.title}
        </span>
        {isGreaterThan(chargeItem.quantity, 1) && (
          <span className="text-sm text-gray-950 whitespace-nowrap">
            {t("x")} {round(chargeItem.quantity)}
          </span>
        )}
      </div>
      <div className="flex flex-row items-center gap-2 sm:shrink-0">
        <div className="font-semibold text-sm flex items-center">
          <span className="items-center">
            <MonetaryDisplay amount={chargeItem.total_price} />
          </span>
          {chargeItem.total_price_components?.length > 0 && (
            <Popover>
              <PopoverTrigger>
                <InfoIcon className="size-4 text-gray-700 cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent
                side="right"
                className="p-0 w-auto max-w-[calc(100vw-2rem)]"
              >
                <ChargeItemPriceDisplay
                  priceComponents={chargeItem.total_price_components}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
        {invoiceUrl ? (
          <Button
            variant="outline"
            size="xs"
            onClick={() => navigate(invoiceUrl)}
          >
            {t("invoice")}
            <CareIcon icon="l-external-link-alt" className="size-6" />
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
  );
}
