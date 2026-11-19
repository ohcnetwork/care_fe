import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import deviceApi from "@/types/device/deviceApi";
import query from "@/Utils/request/query";

interface DeviceCrumbProps {
  facilityId: string;
  deviceId: string;
}

/** Breadcrumb label for a device: its registered name once loaded. */
export function DeviceCrumb({ facilityId, deviceId }: DeviceCrumbProps) {
  const { t } = useTranslation();
  const { data: device } = useQuery({
    queryKey: ["device", facilityId, deviceId],
    queryFn: query(deviceApi.retrieve, {
      pathParams: { facility_id: facilityId, id: deviceId },
    }),
  });
  return <>{device?.registered_name ?? t("device")}</>;
}
