import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";

import query from "@/Utils/request/query";
import deviceApi from "@/types/device/deviceApi";

import DeviceForm from "./components/DeviceForm";

interface Props {
  facilityId: string;
  deviceId: string;
}

export default function UpdateDevice({ facilityId, deviceId }: Props) {
  const { t } = useTranslation();

  const { data: device, isLoading } = useQuery({
    queryKey: ["device", facilityId, deviceId],
    queryFn: query(deviceApi.retrieve, {
      pathParams: { facility_id: facilityId, id: deviceId },
    }),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle title={t("update_device")} />
        <Link href={`/facility/${facilityId}/settings/devices/${deviceId}`}>
          <Button variant="outline">{t("back")}</Button>
        </Link>
      </div>

      {isLoading ? (
        <Loading />
      ) : device ? (
        <DeviceForm
          facilityId={facilityId}
          device={device}
          onSuccess={() => {
            window.history.back();
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-muted-foreground">{t("device_not_found")}</p>
          <Link href={`/facility/${facilityId}/settings/devices/${deviceId}`}>
            <Button variant="outline">{t("back")}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
