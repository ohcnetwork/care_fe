import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { InnerPageHeader } from "@/components/Common/InnerPageHeader";

import query from "@/Utils/request/query";
import deviceApi from "@/types/device/deviceApi";

interface DevicePageHeaderProps {
  facilityId: string;
  facilityName: string;
  deviceId: string;
}

export function DevicePageHeader({
  facilityId,
  facilityName,
  deviceId,
}: DevicePageHeaderProps) {
  const { t } = useTranslation();
  const { data: device } = useQuery({
    queryKey: ["device", facilityId, deviceId],
    queryFn: query(deviceApi.retrieve, {
      pathParams: { facility_id: facilityId, id: deviceId },
    }),
  });
  const baseUrl = `/facility/${facilityId}`;

  return (
    <InnerPageHeader
      dataCy="facility-settings-page-header"
      breadcrumbs={[
        {
          label: facilityName,
          href: `${baseUrl}/overview`,
          hideOnMobile: true,
        },
        {
          label: t("settings"),
          href: `${baseUrl}/settings/general`,
          hideOnMobile: true,
        },
        { label: t("devices"), href: `${baseUrl}/settings/devices` },
        { label: device?.registered_name ?? t("device") },
      ]}
    />
  );
}
