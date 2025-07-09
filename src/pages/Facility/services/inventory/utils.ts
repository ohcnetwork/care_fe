import { ProductRead } from "@/types/inventory/product/product";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { SupplyRequestRead } from "@/types/inventory/supplyRequest/supplyRequest";

export interface ReceiveStockEntry {
  supply_request: SupplyRequestRead | null;
  supplied_item: ProductRead | null;
  supplied_item_quantity: number;
  _checked?: boolean;
  _product_knowledge: ProductKnowledgeBase | null;
  _is_additional: boolean;
}

export interface EditingItem {
  entry: ReceiveStockEntry;
  index: number | null;
}
