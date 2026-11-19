import { useTranslation } from "react-i18next";

import { getFacilitySettingsPageTitle } from "@/components/ui/sidebar/facility/settings/facility-settings-nav";

/**
 * Breadcrumb label derived from the URL. Used by settings areas that still
 * render a nested raviger route table (billing) until they get file routes.
 */
export function LegacySettingsTitleCrumb({ pathname }: { pathname: string }) {
  const { t } = useTranslation();
  return <>{getFacilitySettingsPageTitle(pathname, t)}</>;
}
