import { ProductRead } from "@/types/inventory/product/product";
import { LocationList } from "@/types/location/location";

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
  net_content: number;
  product: ProductRead;
}

export interface InventoryRetrieve extends InventoryRead {
  location: LocationList;
}

export type InventoryWrite = InventoryBase;
