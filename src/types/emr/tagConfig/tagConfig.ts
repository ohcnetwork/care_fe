import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import { Organization } from "@/types/organization/organization";

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
  PRESCRIPTION = "medication_request_prescription",
}

export interface TagConfigBase {
  id: string;
  parent?: TagConfigBase;
  display: string;
  category: TagCategory;
  description: string;
  level_cache: number;
  cache_expiry: string;
}

export interface TagConfig extends TagConfigBase {
  meta: TagConfigMeta;
  priority: number;
  status: TagStatus;
  system_generated: boolean;
  has_children: boolean;
  resource: TagResource;
  facility?: string;
}

export interface TagConfigRead extends TagConfig {
  facility_organization?: FacilityOrganizationRead;
  organization?: Organization;
}

export interface TagConfigRequest {
  display: string;
  category: TagCategory;
  description?: string;
  priority?: number;
  status: TagStatus;
  parent?: string | null;
  resource: TagResource;
  organization?: string;
  facility?: string;
  facility_organization?: string;
}

export function getTagHierarchyDisplay(
  tag: TagConfig,
  separator: string = ": ",
): string {
  // Build hierarchy iteratively to avoid stack overflow
  let currentTag: TagConfigBase | undefined = tag.parent;
  const tempHierarchy: string[] = [];

  while (currentTag) {
    if (currentTag.display) {
      tempHierarchy.unshift(currentTag.display);
    }
    currentTag = currentTag.parent;
  }

  return [...tempHierarchy, tag.display].join(separator);
}
