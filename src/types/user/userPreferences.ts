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

export interface UserPreference {
  quick_links?: QuickLinksPreferences;
}

export type UserPreferenceKey = keyof UserPreference;

export interface UserPreferenceRequest<
  K extends UserPreferenceKey = UserPreferenceKey,
> {
  preference: K;
  value: UserPreference[K];
}
