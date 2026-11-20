import { useTranslation } from "react-i18next";

import { getFacilitySettingsPageTitle } from "@/components/ui/sidebar/facility/settings/facility-settings-nav";

import {
  Breadcrumbs,
  useHasRouteCrumbs,
} from "@/components/Common/Breadcrumbs";
import { InnerPageHeader } from "@/components/Common/InnerPageHeader";

import { DevicePageHeader } from "@/pages/Facility/settings/devices/DevicePageHeader";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

import { usePathname } from "@/lib/router/location";

export function FacilitySettingsPageHeader() {
  const { t } = useTranslation();
  const { facilityId, facility } = useCurrentFacility();
  const path = usePathname();
  const baseUrl = `/facility/${facilityId}`;
  const hasRouteCrumbs = useHasRouteCrumbs();

  // Settings pages in src/routes/ describe their own crumbs.
  if (hasRouteCrumbs) {
    return (
      <Breadcrumbs
        dataCy="facility-settings-page-header"
        leading={[
          {
            label: facility?.name ?? t("facility"),
            href: `${baseUrl}/overview`,
          },
        ]}
      />
    );
  }

  // Fallback for paths that have no route crumbs (templates, plugin settings
  // plugin settings routes).
  const deviceId = path.match(
    /^\/facility\/[^/]+\/settings\/devices\/([^/]+)(?:\/responses)?\/?$/,
  )?.[1];

  if (deviceId && deviceId !== "create") {
    return (
      <DevicePageHeader
        facilityId={facilityId}
        facilityName={facility?.name ?? t("facility")}
        deviceId={deviceId}
      />
    );
  }

  return (
    <InnerPageHeader
      dataCy="facility-settings-page-header"
      breadcrumbs={[
        {
          label: facility?.name ?? t("facility"),
          href: `${baseUrl}/overview`,
          hideOnMobile: true,
        },
        { label: t("settings"), href: `${baseUrl}/settings/general` },
        { label: getFacilitySettingsPageTitle(path, t) },
      ]}
    />
  );
}
