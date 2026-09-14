export const isFacilitySettingsPath = (path: string) =>
  /^\/facility\/[^/]+\/(settings|template)(\/|$)/.test(path);
