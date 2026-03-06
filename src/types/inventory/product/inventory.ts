import { ProductRead } from "@/types/inventory/product/product";
import { LocationRead } from "@/types/location/location";

export const InventoryStatusOptions = [
  "active",
  "inactive",
  "entered_in_error",
] as const;

export type InventoryStatus = (typeof InventoryStatusOptions)[number];

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
