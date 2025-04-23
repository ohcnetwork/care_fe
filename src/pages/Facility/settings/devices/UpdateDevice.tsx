import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import Loading from "@/components/Common/Loading";

import useAppHistory from "@/hooks/useAppHistory";

import query from "@/Utils/request/query";
import deviceApi from "@/types/device/deviceApi";

import DeviceForm from "./components/DeviceForm";
import DeviceTypeIcon from "./components/DeviceTypeIcon";

interface Props {
  facilityId: string;
  deviceId: string;
}

export default function UpdateDevice({ facilityId, deviceId }: Props) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  const { data: device, isLoading } = useQuery({
    queryKey: ["device", facilityId, deviceId],
    queryFn: query(deviceApi.retrieve, {
      pathParams: { facility_id: facilityId, id: deviceId },
    }),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <div className="inline-flex items-center">
        <DeviceTypeIcon type={device?.care_type} className="size-5 mr-2" />
        <span className="text-2xl font-bold capitalize">
          {device?.care_type
            ? t("update_device_with_type", { type: device.care_type })
            : t("update_device")}
        </span>
      </div>
      <Separator />
      {isLoading ? (
        <Loading />
      ) : device ? (
        <div className="pt-4">
          <DeviceForm
            facilityId={facilityId}
            device={device}
            onSuccess={() => {
              toast.success(t("device_updated"));
              goBack(`/facility/${facilityId}/settings/devices/${device.id}`);
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-gray-500">{t("device_not_found")}</p>
          <Link href={`/facility/${facilityId}/settings/devices/${deviceId}`}>
            <Button variant="outline">{t("back")}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
