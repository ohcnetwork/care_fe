import { useTranslation } from "react-i18next";

import { MonetaryDisplay } from "@/components/ui/monetary-display";

import { Separator } from "@/components/ui/separator";
import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import {
  MRP_CODE,
  PURCHASE_PRICE_CODE,
} from "@/types/billing/chargeItem/chargeItem";

interface ChargeItemPriceSummaryProps {
  priceComponents: MonetaryComponent[];
}

export default function ChargeItemPriceDisplay({
  priceComponents,
}: ChargeItemPriceSummaryProps) {
  const { t } = useTranslation();

  if (!priceComponents?.length) return null;

  const baseComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.base,
  );

  const mrpComponents = priceComponents.filter(
    (c) =>
      c.monetary_component_type === MonetaryComponentType.informational &&
      c.code?.code === MRP_CODE,
  );

  const purchasePriceComponents = priceComponents.filter(
    (c) =>
      c.monetary_component_type === MonetaryComponentType.informational &&
      c.code?.code === PURCHASE_PRICE_CODE,
  );

  const taxComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.tax,
  );
  const discountComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.discount,
  );
  const surchargeComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.surcharge,
  );

  const baseAmount = baseComponents[0]?.amount || "0";
  const mrpAmount = mrpComponents[0]?.amount;
  const purchasePriceAmount = purchasePriceComponents[0]?.amount;
  const showAsterisk =
    discountComponents.some((c) => c.conditions?.length) || false;

  const renderComponentValue = (
    component: MonetaryComponent,
    prefix: string,
  ) => {
    if (!component.amount && !component.factor) {
      return null;
    }

    return (
      <span>
        {prefix}
        {component.amount && (
          <MonetaryDisplay amount={component.amount} className="mr-2" />
        )}
        {component.factor && <MonetaryDisplay factor={component.factor} />}
      </span>
    );
  };

  return (
    <div className="p-3">
      <p className="font-medium text-sm mb-2">
        {t("component_wise_breakdown")}
      </p>
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex justify-between">
          <span>{t("base_amount")}</span>
          <MonetaryDisplay amount={baseAmount} />
        </div>

        {surchargeComponents.map((component, index) => (
          <div
            key={`surcharge-${index}`}
            className="flex justify-between text-gray-500"
          >
            <span className="max-w-40">
              {component.code?.display || t("surcharge")}
            </span>
            {renderComponentValue(component, "+")}
          </div>
        ))}

        {discountComponents.map((component, index) => (
          <div
            key={`discount-${index}`}
            className="flex justify-between gap-2 text-gray-500"
          >
            <span className="max-w-40">
              {component.code?.display || t("discount")}
              {component.conditions?.length ? (
                <span className="ml-1 text-xs text-gray-400">
                  ({t("conditional")})*
                </span>
              ) : null}
            </span>
            {renderComponentValue(component, "-")}
          </div>
        ))}

        {taxComponents.map((component, index) => (
          <div
            key={`tax-${index}`}
            className="flex justify-between text-gray-500"
          >
            <span className="max-w-40">
              {component.code?.display || t("tax")}
            </span>
            {renderComponentValue(component, "+")}
          </div>
        ))}

        {mrpAmount && (
          <div className="flex justify-between text-gray-500">
            <span>{t("mrp")}</span>
            <MonetaryDisplay amount={mrpAmount} />
          </div>
        )}

        {purchasePriceAmount && (
          <div className="flex justify-between text-gray-500">
            <span>{t("purchase_price")}</span>
            <MonetaryDisplay amount={purchasePriceAmount} />
          </div>
        )}

        {showAsterisk && (
          <>
            <Separator />
            <p className="text-xs text-gray-400 mt-2">
              *{t("conditional_discounts_not_applied")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
