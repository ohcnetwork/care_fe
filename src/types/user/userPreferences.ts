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

export interface UserPreferenceRequest {
  preference: string;
  version?: string;
  value: Record<string, unknown>;
}
