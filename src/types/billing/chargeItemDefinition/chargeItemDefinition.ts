import { MonetaryComponent } from "@/types/base/monetaryComponent/monetaryComponent";
import { ResourceCategoryRead } from "@/types/base/resourceCategory/resourceCategory";
import { SlugConfig } from "@/types/base/slug/slugConfig";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";

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
  derived_from_uri?: string;
  description?: string;
  purpose?: string;
  price_components: MonetaryComponent[];
  category: ResourceCategoryRead;
  slug_config: SlugConfig;
  tags: TagConfig[];
  can_edit_charge_item: boolean;
}

export interface ChargeItemDefinitionRead extends ChargeItemDefinitionBase {
  version?: number;
  category: ResourceCategoryRead;
}

export interface ChargeItemDefinitionCreate extends Omit<
  ChargeItemDefinitionBase,
  "id" | "category" | "slug_config" | "slug" | "tags"
> {
  slug_value: string;
  category: string;
  version?: number;
}
