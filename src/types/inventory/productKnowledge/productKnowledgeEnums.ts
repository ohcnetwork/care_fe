// No imports: the router's search schemas load this file at startup.

export enum ProductKnowledgeType {
  medication = "medication",
  nutritional_product = "nutritional_product",
  consumable = "consumable",
}

export enum ProductKnowledgeStatus {
  draft = "draft",
  active = "active",
  retired = "retired",
}
