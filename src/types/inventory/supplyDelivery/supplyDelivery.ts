import { DeliveryOrderRetrieve } from "@/types/inventory/deliveryOrder/deliveryOrder";
import { InventoryRead } from "@/types/inventory/product/inventory";
import { ProductRead } from "@/types/inventory/product/product";
import { SupplyRequestRead } from "@/types/inventory/supplyRequest/supplyRequest";
import { LocationDetail } from "@/types/location/location";
import { Organization } from "@/types/organization/organization";

export enum SupplyDeliveryStatus {
  in_progress = "in_progress",
  completed = "completed",
  abandoned = "abandoned",
  entered_in_error = "entered_in_error",
}

export const SUPPLY_DELIVERY_STATUS_COLORS = {
  in_progress: "blue",
  completed: "green",
  abandoned: "destructive",
  entered_in_error: "destructive",
} as const satisfies Record<SupplyDeliveryStatus, string>;

export enum SupplyDeliveryType {
  product = "product",
  device = "device",
}

export enum SupplyDeliveryCondition {
  normal = "normal",
  damaged = "damaged",
}

export const SUPPLY_DELIVERY_CONDITION_COLORS = {
  normal: "secondary",
  damaged: "destructive",
} as const satisfies Record<SupplyDeliveryCondition, string>;

export interface SupplyDeliveryBase {
  id: string;
  status: SupplyDeliveryStatus;
  supplied_item_condition?: SupplyDeliveryCondition;
  supplied_item_type: SupplyDeliveryType;
}

export interface SupplyDeliveryCreate extends Omit<SupplyDeliveryBase, "id"> {
  supplied_item_quantity: number;
  supplied_item?: string; // Product ID
  supplied_inventory_item?: string; // Inventory Item ID
  supplier?: string; // Product Supplier Organization ID
  origin?: string; // Location ID
  destination: string; // Location ID
  supply_request?: string; // Supply Request ID
  order: string; // Delivery Order ID
}

export interface SupplyDeliveryUpsert extends Omit<SupplyDeliveryBase, "id"> {
  id?: string;
  supplied_item_quantity: number;
  supplied_item?: string; // Product ID
  supplied_inventory_item?: string; // Inventory Item ID
  origin?: string; // Location ID
  destination: string; // Location ID
  supply_request?: string; // Supply Request ID
  order: string; // Delivery Order ID
}

export interface SupplyDeliveryUpdate {
  status: SupplyDeliveryStatus;
  supplied_item_condition?: SupplyDeliveryCondition;
}

export interface SupplyDeliveryRead extends SupplyDeliveryBase {
  supplied_item_quantity: number;
  supplied_item: ProductRead;
  supplied_inventory_item?: InventoryRead;
  origin?: LocationDetail;
  destination: LocationDetail;
  supplier?: Organization;
  created_date?: string;
  modified_date?: string;
  order: DeliveryOrderRetrieve;
}

export interface SupplyDeliveryRetrieve extends SupplyDeliveryRead {
  supply_request?: SupplyRequestRead;
}
