export interface TagConfigMeta {
  [key: string]: unknown;
}

export enum TagCategory {
  DIET = "diet",
  DRUG = "drug",
  LAB = "lab",
  ADMIN = "admin",
  CONTACT = "contact",
  CLINICAL = "clinical",
  BEHAVIORAL = "behavioral",
  RESEARCH = "research",
  ADVANCE_DIRECTIVE = "advance_directive",
  SAFETY = "safety",
}

export enum TagStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export const TAG_STATUS_COLORS = {
  active: "green",
  archived: "secondary",
} as const satisfies Record<TagStatus, string>;

export enum TagResource {
  ENCOUNTER = "encounter",
  APPOINTMENT = "token_booking",
  ACTIVITY_DEFINITION = "activity_definition",
  SERVICE_REQUEST = "service_request",
  CHARGE_ITEM = "charge_item",
  PATIENT = "patient",
}

export interface TagConfig {
  meta: TagConfigMeta;
  id: string;
  slug: string;
  display: string;
  category: TagCategory;
  description: string;
  priority: number;
  status: TagStatus;
  level_cache: number;
  system_generated: boolean;
  has_children: boolean;
  parent: TagConfig | Record<string, never>;
  resource: TagResource;
}

export interface TagConfigRequest {
  slug: string;
  display: string;
  category: TagCategory;
  description?: string;
  priority?: number;
  status: TagStatus;
  parent?: string | null;
  resource: TagResource;
  facility?: string;
}
