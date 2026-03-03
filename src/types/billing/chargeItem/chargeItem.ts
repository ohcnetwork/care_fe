import { BatchSuccessResponse } from "@/types/base/batch/batch";
import {
  DiscountConfiguration,
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import { InvoiceRead } from "@/types/billing/invoice/invoice";
import { UserReadMinimal } from "@/types/user/user";

export enum ChargeItemStatus {
  // planned = "planned",
  billable = "billable",
  not_billable = "not_billable",
  aborted = "aborted",
  billed = "billed",
  paid = "paid",
  entered_in_error = "entered_in_error",
}

export const EXCLUDED_CHARGE_ITEM_STATUSES = [
  ChargeItemStatus.not_billable,
  ChargeItemStatus.entered_in_error,
  ChargeItemStatus.aborted,
];

export const CHARGE_ITEM_STATUS_COLORS = {
  // planned: "blue",
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

export interface ChargeItemCreate extends Omit<
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
  performer_actor?: string;
  account?: string;
}

export interface ApplyMultipleChargeItemDefinitionRequest {
  requests: ApplyChargeItemDefinitionRequest[];
}

export interface ChargeItemUpdate extends Omit<
  ChargeItemBase,
  "service_resource_id" | "service_resource" | "paid_invoice" | "total_price"
> {
  account?: string;
  performer_actor?: string;
}

export interface ChargeItemRead extends ChargeItemBase {
  total_price_components: MonetaryComponent[];
  discount_configuration: DiscountConfiguration | null;
  charge_item_definition: ChargeItemDefinitionBase;
  service_resource: ChargeItemServiceResource;
  service_resource_id?: string;
  performer_actor?: UserReadMinimal;
  created_date: string;
  modified_date: string;
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
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

export enum PriceComponentType {
  unit_price = "unit_price",
  total_price = "total_price",
}

export function getComponentsFromChargeItem(
  item: ChargeItemRead | ChargeItemDefinitionBase,
  componentType: MonetaryComponentType,
  componentField: PriceComponentType = PriceComponentType.total_price,
): MonetaryComponent[] {
  let components: MonetaryComponent[];

  if ("total_price_components" in item) {
    if (componentField === PriceComponentType.unit_price) {
      components = item.unit_price_components;
    } else if (componentField === PriceComponentType.total_price) {
      components = item.total_price_components;
    } else {
      throw new Error(
        `Invalid componentField "${componentField}" for ChargeItemRead. Expected "unit_price" or "total_price".`,
      );
    }
  } else {
    components = item.price_components;
  }

  return components.filter(
    (component) => component.monetary_component_type === componentType,
  );
}

export const MRP_CODE = "mrp";
export const PURCHASE_PRICE_CODE = "purchase_price";
