import { MonetaryComponent } from "@/types/base/monetaryComponent/monetaryComponent";

export enum ChargeItemDefinitionStatus {
  draft = "draft",
  active = "active",
  retired = "retired",
}

export const CHARGE_ITEM_DEFINITION_STATUS_COLORS = {
  draft: "secondary",
  active: "primary",
  retired: "destructive",
} as const satisfies Record<ChargeItemDefinitionStatus, string>;

export interface ChargeItemDefinitionBase {
  id: string;
  status: ChargeItemDefinitionStatus;
  title: string;
  slug: string;
  derived_from_uri: string | null;
  description: string | null;
  purpose: string | null;
  price_components: MonetaryComponent[];
}

export interface ChargeItemDefinitionRead extends ChargeItemDefinitionBase {
  version?: number | null;
}

export interface ChargeItemDefinitionCreate
  extends Omit<ChargeItemDefinitionBase, "id"> {
  version?: number | null;
}
