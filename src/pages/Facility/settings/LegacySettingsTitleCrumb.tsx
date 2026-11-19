import { useTranslation } from "react-i18next";

import { getFacilitySettingsPageTitle } from "@/components/ui/sidebar/facility/settings/facility-settings-nav";

/**
 * Breadcrumb label derived from the URL. The billing settings not-found
 * route uses it: an unknown sub-path shows the title of its closest known
 * page.
 */
export function LegacySettingsTitleCrumb({ pathname }: { pathname: string }) {
  const { t } = useTranslation();
  return <>{getFacilitySettingsPageTitle(pathname, t)}</>;
}
