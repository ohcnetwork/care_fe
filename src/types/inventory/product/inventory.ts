import { ProductRead } from "@/types/inventory/product/product";
import { LocationRead } from "@/types/location/location";

export const InventoryStatusOptions = [
  "active",
  "inactive",
  "entered_in_error",
] as const;

export type InventoryStatus = (typeof InventoryStatusOptions)[number];

export const INVENTORY_STATUS_COLORS = {
  active: "primary",
  inactive: "secondary",
  entered_in_error: "destructive",
} as const satisfies Record<InventoryStatus, string>;

interface InventoryBase {
  status: InventoryStatus;
}

export interface InventoryRead extends InventoryBase {
  id: string;
  net_content: string;
  product: ProductRead;
  location: LocationRead;
}

export interface InventoryRetrieve extends InventoryRead {
  location: LocationRead;
}

export type InventoryWrite = InventoryBase;
