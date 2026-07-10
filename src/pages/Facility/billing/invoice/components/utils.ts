import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { InvoiceRead } from "@/types/billing/invoice/invoice";

export const invoiceTableHeadClass =
  "border-r border-gray-200 font-medium text-center";

export const invoiceTableCellClass =
  "border-r border-gray-200 font-medium text-gray-950 text-sm";

const getUnitComponentsByType = (
  item: ChargeItemRead,
  type: MonetaryComponentType,
) => {
  return (
    item.unit_price_components?.filter(
      (c) => c.monetary_component_type === type,
    ) || []
  );
};

export const getApplicableTaxColumns = (invoice: InvoiceRead) => {
  const invoiceTaxCodes = new Set<string>();
  invoice.charge_items.forEach((item) => {
    getUnitComponentsByType(item, MonetaryComponentType.tax).forEach(
      (taxComponent) => {
        if (taxComponent.code?.code) {
          invoiceTaxCodes.add(taxComponent.code.code);
        }
      },
    );
  });
  return Array.from(invoiceTaxCodes);
};

export const getBaseComponent = (item: ChargeItemRead) => {
  return item.unit_price_components?.find(
    (c) => c.monetary_component_type === MonetaryComponentType.base,
  );
};
