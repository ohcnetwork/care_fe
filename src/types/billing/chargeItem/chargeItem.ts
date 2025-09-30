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

export enum ChargeItemServiceResource {
  service_request = "service_request",
  medication_dispense = "medication_dispense",
  appointment = "appointment",
  bed_association = "bed_association",
}

export interface ChargeItemOverrideReason {
  code: string;
  display?: string;
}

export interface ChargeItemBase {
  id: string;
  title: string;
  description?: string;
  status: ChargeItemStatus;
  quantity: string;
  unit_price_components: MonetaryComponent[];
  note?: string;
  override_reason?: ChargeItemOverrideReason;
  total_price: string;
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
  encounter?: string;
  patient?: string;
  account?: string;
  service_resource?: ChargeItemServiceResource;
  service_resource_id?: string;
}

export interface ApplyChargeItemDefinitionRequest {
  charge_item_definition: string;
  quantity: string;
  encounter?: string;
  patient?: string;
  service_resource?: ChargeItemServiceResource;
  service_resource_id?: string;
}

export interface ApplyMultipleChargeItemDefinitionRequest {
  requests: ApplyChargeItemDefinitionRequest[];
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
  total_price: string;
  charge_item_definition: ChargeItemDefinitionBase;
  service_resource: ChargeItemServiceResource;
  service_resource_id?: string;
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

export const MRP_CODE = "mrp";
export const PURCHASE_PRICE_CODE = "purchase_price";
