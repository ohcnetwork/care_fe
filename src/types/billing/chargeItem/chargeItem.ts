import { BatchSuccessResponse } from "@/types/base/batch/batch";
import { MonetaryComponent } from "@/types/base/monetaryComponent/monetaryComponent";
import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import { InvoiceRead } from "@/types/billing/invoice/invoice";

export enum ChargeItemStatus {
  planned = "planned",
  billable = "billable",
  not_billable = "not_billable",
  aborted = "aborted",
  billed = "billed",
  paid = "paid",
  entered_in_error = "entered_in_error",
}

export const CHARGE_ITEM_STATUS_COLORS = {
  planned: "blue",
  billable: "indigo",
  not_billable: "yellow",
  aborted: "destructive",
  billed: "green",
  paid: "primary",
  entered_in_error: "destructive",
} as const satisfies Record<ChargeItemStatus, string>;

export interface ChargeItemOverrideReason {
  code: string;
  display?: string;
}

export interface ChargeItemBase {
  id: string;
  title: string;
  description?: string;
  status: ChargeItemStatus;
  quantity: number;
  unit_price_components: MonetaryComponent[];
  note?: string;
  override_reason?: ChargeItemOverrideReason;
  service_resource?: "service_request";
  service_resource_id?: string;
  total_price: number;
  paid_invoice?: InvoiceRead;
}

export interface ChargeItemCreate
  extends Omit<
    ChargeItemBase,
    | "id"
    | "service_resource_id"
    | "service_resource"
    | "paid_invoice"
    | "total_price"
  > {
  encounter: string;
  account?: string;
}

export interface ChargeItemUpsert
  extends Omit<ChargeItemBase, "id" | "paid_invoice" | "total_price"> {
  id?: string;
  account?: string;
  encounter: string;
}
export interface ChargeItemUpdate
  extends Omit<
    ChargeItemBase,
    "service_resource_id" | "service_resource" | "paid_invoice" | "total_price"
  > {
  account?: string;
}

export interface ChargeItemRead extends ChargeItemBase {
  total_price_components: MonetaryComponent[];
  total_price: number;
  charge_item_definition: ChargeItemDefinitionBase;
}

export interface ChargeItemBatchResponse {
  results: BatchSuccessResponse<{ charge_item: ChargeItemRead }>[];
}

export function extractChargeItemsFromBatchResponse(
  response: ChargeItemBatchResponse,
): ChargeItemRead[] {
  return response.results
    .map((item) => item.data?.charge_item)
    .filter((item): item is ChargeItemRead => !!item);
}
