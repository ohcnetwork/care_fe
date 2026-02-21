export interface ExtensionSchema {
  [key: string]: unknown;
}

export interface ExtensionConfig {
  name: string;
  owner: string;
  version: string;
  write_schema: ExtensionSchema;
  read_schema: ExtensionSchema;
  retrieve_schema: ExtensionSchema;
}

export enum ExtensionEntityType {
  account = "account",
  encounter = "encounter",
  patient = "patient",
  payment_reconciliation = "payment_reconciliation",
  supply_delivery = "supply_delivery",
  supply_delivery_order = "supply_delivery_order",
  product = "product",
}

export type ExtensionRegistry = Record<ExtensionEntityType, ExtensionConfig[]>;
