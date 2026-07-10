import type { TFunction } from "i18next";

import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { InvoiceRead, InvoiceStatus } from "@/types/billing/invoice/invoice";

export const invoiceTableHeadClass =
  "border-r border-gray-200 font-medium text-center";

export const invoiceTableCellClass =
  "border-r border-gray-200 font-medium text-gray-950 text-sm";

export function getUnitComponentsByType(
  item: ChargeItemRead,
  type: MonetaryComponentType,
) {
  return (
    item.unit_price_components?.filter(
      (c) => c.monetary_component_type === type,
    ) || []
  );
}

export function getApplicableTaxColumns(invoice: InvoiceRead) {
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
}

export function getBaseComponent(item: ChargeItemRead) {
  return item.unit_price_components?.find(
    (c) => c.monetary_component_type === MonetaryComponentType.base,
  );
}

export type InvoiceWatermark = {
  text: string;
  color: "red" | "gray";
};

export function getInvoiceWatermark(
  invoice: InvoiceRead,
  t: TFunction,
  options?: { includeDraft?: boolean },
): InvoiceWatermark | undefined {
  if (invoice.status === InvoiceStatus.cancelled) {
    return { text: t("cancelled"), color: "red" };
  }
  if (invoice.status === InvoiceStatus.entered_in_error) {
    return { text: t("entered_in_error"), color: "red" };
  }
  if (options?.includeDraft && invoice.status === InvoiceStatus.draft) {
    return { text: t("draft"), color: "gray" };
  }
  return undefined;
}
