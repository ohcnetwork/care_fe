import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";

export enum ProductStatusOptions {
  active = "active",
  inactive = "inactive",
  entered_in_error = "entered_in_error",
}

export const PRODUCT_STATUS_COLORS = {
  active: "primary",
  inactive: "secondary",
  entered_in_error: "destructive",
} as const satisfies Record<ProductStatusOptions, string>;

export type ProductBatch = {
  lot_number?: string;
};

export interface ProductBase {
  id: string;
  status: ProductStatusOptions;
  batch?: ProductBatch;
  expiration_date?: string;
}

export interface ProductCreate extends Omit<ProductBase, "id"> {
  product_knowledge: string;
  charge_item_definition?: string;
}

export interface ProductUpdate extends ProductBase {
  charge_item_definition?: string;
  product_knowledge: string;
}

export interface ProductRead extends ProductBase {
  product_knowledge: ProductKnowledgeBase;
  charge_item_definition?: ChargeItemDefinitionBase;
}
