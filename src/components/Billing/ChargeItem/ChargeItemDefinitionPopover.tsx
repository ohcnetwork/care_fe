import { useTranslation } from "react-i18next";

import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import ChargeItemPriceDisplay from "@/components/Billing/ChargeItem/ChargeItemPriceDisplay";

import { cn } from "@/lib/utils";
import { calculateTotalPrice } from "@/types/base/monetaryComponent/monetaryComponent";
import { ChargeItemDefinitionRead } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";

interface ChargeItemDefinitionPopoverProps {
  chargeItemDefinition: ChargeItemDefinitionRead;
  className?: string;
}

export default function ChargeItemDefinitionPopover({
  chargeItemDefinition,
  className,
}: ChargeItemDefinitionPopoverProps) {
  const { t } = useTranslation();
  const priceComponents = chargeItemDefinition.price_components;

  const hasPriceComponents = priceComponents && priceComponents.length > 0;

  if (!hasPriceComponents) {
    return (
      <span className={cn("text-sm text-gray-500", className)}>{t("na")}</span>
    );
  }

  const totalPrice = calculateTotalPrice(priceComponents);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "text-sm font-medium underline decoration-dotted underline-offset-4 cursor-pointer hover:text-primary-700 transition-colors",
            className,
          )}
          aria-label={t("view_details")}
        >
          <MonetaryDisplay amount={totalPrice.toString()} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="p-0 w-auto max-w-[calc(100vw-2rem)]"
      >
        <div className="p-3 space-y-2">
          <div>
            <p className="font-medium text-sm">{chargeItemDefinition.title}</p>
            {chargeItemDefinition.description && (
              <p className="text-xs text-gray-600 mt-1">
                {chargeItemDefinition.description}
              </p>
            )}
          </div>
          {chargeItemDefinition.purpose && (
            <div>
              <p className="text-xs text-gray-500">{t("purpose")}</p>
              <p className="text-xs text-gray-700">
                {chargeItemDefinition.purpose}
              </p>
            </div>
          )}
        </div>
        <Separator />
        <ChargeItemPriceDisplay priceComponents={priceComponents} />
      </PopoverContent>
    </Popover>
  );
}
