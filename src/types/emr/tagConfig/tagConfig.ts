import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import { Organization } from "@/types/organization/organization";
import { TagCategory, TagResource, TagStatus } from "./tagConfigEnums";

export { TagCategory, TagResource, TagStatus };

export interface TagConfigMeta {
  [key: string]: unknown;
}

export const TAG_STATUS_COLORS = {
  active: "green",
  archived: "secondary",
} as const satisfies Record<TagStatus, string>;

export interface TagExpiryOffset {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

export interface TagConfigExpiryMetadata {
  /** Apply `expiry_offset` automatically whenever the tag is set. */
  autoset_expiry?: boolean;
  expiry_offset?: TagExpiryOffset;
  /** Let users pick their own expiry offset when setting the tag. */
  modification_allowed?: boolean;
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
  metadata: TagConfigMeta;
  priority: number;
  status: TagStatus;
  system_generated: boolean;
  has_children: boolean;
  resource: TagResource;
  facility?: string;
  expiry_metadata?: TagConfigExpiryMetadata;
  /** Present on tags rendered on a resource that were set with an expiry. */
  expiry?: string;
  expired?: boolean;
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
  organization: string | null;
  facility?: string;
  facility_organization: string | null;
  metadata?: TagConfigMeta;
  expiry_metadata?: TagConfigExpiryMetadata;
}

export interface TagSetRequest {
  tag: string;
  expiry_offset?: TagExpiryOffset;
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
