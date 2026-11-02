export interface QuickLinkCustom {
  link: string;
  title: string;
  icon?: string;
  description?: string;
  facilityId?: string;
}

export interface QuickLinksPreferences {
  blacklist?: string[];
  custom_links?: QuickLinkCustom[];
}

export interface EncounterListPreferences {
  /** An encounter class, or "all"; see useDefaultEncounterClass. */
  default_class?: string;
}

export interface PinnedFacilitiesPreferences {
  /** Facility ids in the order they were pinned. */
  facility_ids?: string[];
}

export interface UserPreferenceRequest {
  preference: string;
  version?: string;
  value: Record<string, unknown>;
}
