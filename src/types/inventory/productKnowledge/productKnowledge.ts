import { Code } from "@/types/base/code/code";
import { Duration } from "@/types/base/duration/duration";

export enum ProductKnowledgeType {
  medication = "medication",
  nutritional_product = "nutritional_product",
  consumable = "consumable",
}

export const PRODUCT_KNOWLEDGE_TYPE_COLORS = {
  medication: "blue",
  nutritional_product: "green",
  consumable: "yellow",
} as const satisfies Record<ProductKnowledgeType, string>;

export enum ProductKnowledgeStatus {
  draft = "draft",
  active = "active",
  retired = "retired",
}

export const PRODUCT_KNOWLEDGE_STATUS_COLORS = {
  draft: "secondary",
  active: "primary",
  retired: "destructive",
} as const satisfies Record<ProductKnowledgeStatus, string>;

export enum ProductNameTypes {
  trade_name = "trade_name",
  alias = "alias",
  original_name = "original_name",
  preferred = "preferred",
}

export interface ProductName {
  name_type: ProductNameTypes;
  name: string;
}

export interface StorageGuideline {
  note: string;
  stability_duration: Duration;
}

export enum DrugCharacteristicCode {
  imprint_code = "imprint_code",
  size = "size",
  shape = "shape",
  color = "color",
  coating = "coating",
  scoring = "scoring",
  logo = "logo",
  image = "image",
}

export interface DrugCharacteristic {
  code: DrugCharacteristicCode;
  value: string;
}

export interface ProductDefinition {
  dosage_form: Code;
  intended_routes: Code[];
  // TODO: Add ingredients, nutrients, and drug_characteristic types when BE is ready
  ingredients: Code[];
  nutrients: Code[];
  drug_characteristic: DrugCharacteristic[];
}

export interface ProductKnowledgeBase {
  id: string;
  slug: string;
  alternate_identifier?: string;
  product_type: ProductKnowledgeType;
  status: ProductKnowledgeStatus;
  code?: Code;
  name: string;
  names: ProductName[];
  storage_guidelines: StorageGuideline[];
  definitional?: ProductDefinition;
  base_unit: Code;
}

export interface ProductKnowledgeCreate
  extends Omit<ProductKnowledgeBase, "id"> {
  facility: string;
}

export interface ProductKnowledgeUpdate extends ProductKnowledgeBase {
  facility: string;
}
