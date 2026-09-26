import { usePath } from "raviger";
import { useTranslation } from "react-i18next";

import { getFacilitySettingsPageTitle } from "@/components/ui/sidebar/facility/settings/facility-settings-nav";

import { InnerPageHeader } from "@/components/Common/InnerPageHeader";

import { DevicePageHeader } from "@/pages/Facility/settings/devices/DevicePageHeader";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

export function FacilitySettingsPageHeader() {
  const { t } = useTranslation();
  const { facilityId, facility } = useCurrentFacility();
  const path = usePath() ?? "";
  const baseUrl = `/facility/${facilityId}`;
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
