import { useTranslation } from "react-i18next";

import { MonetaryDisplay } from "@/components/ui/monetary-display";

import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";

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
  const taxComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.tax,
  );
  const discountComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.discount,
  );
  const surchargeComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.surcharge,
  );

  const baseAmount = baseComponents[0]?.amount || 0;

  const renderComponentValue = (
    component: MonetaryComponent,
    prefix: string,
  ) => {
    const hasAmount =
      component.amount !== undefined && component.amount !== null;
    const hasFactor =
      component.factor !== undefined && component.factor !== null;

    if (hasAmount && hasFactor) {
      return (
        <span>
          {prefix}
          <MonetaryDisplay amount={component.amount} /> (
          <MonetaryDisplay factor={component.factor} />)
        </span>
      );
    } else if (hasAmount) {
      return (
        <span>
          {prefix}
          <MonetaryDisplay amount={component.amount} />
        </span>
      );
    } else if (hasFactor) {
      return (
        <span>
          {prefix}
          <MonetaryDisplay factor={component.factor} />
        </span>
      );
    }
    return null;
  };

  return (
    <div className="p-3">
      <p className="font-medium text-sm mb-2">
        {t("component_wise_breakdown")}
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>{t("base_amount")}</span>
          <MonetaryDisplay amount={baseAmount} />
        </div>

        {surchargeComponents.map((component, index) => (
          <div
            key={`surcharge-${index}`}
            className="flex justify-between text-gray-500"
          >
            <span>{component.code?.display || t("surcharge")}</span>
            {renderComponentValue(component, "+")}
          </div>
        ))}

        {discountComponents.map((component, index) => (
          <div
            key={`discount-${index}`}
            className="flex justify-between text-gray-500"
          >
            <span>{component.code?.display || t("discount")}</span>
            {renderComponentValue(component, "-")}
          </div>
        ))}

        {taxComponents.map((component, index) => (
          <div
            key={`tax-${index}`}
            className="flex justify-between text-gray-500"
          >
            <span>{component.code?.display || t("tax")}</span>
            {renderComponentValue(component, "+")}
          </div>
        ))}
      </div>
    </div>
  );
}
