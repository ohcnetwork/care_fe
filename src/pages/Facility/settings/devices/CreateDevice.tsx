import { CubeIcon } from "@radix-ui/react-icons";
import { navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Separator } from "@/components/ui/separator";

import DeviceForm from "@/pages/Facility/settings/devices/components/DeviceForm";

import { usePluginDevices } from "./hooks/usePluginDevices";

interface Props {
  facilityId: string;
}

export default function CreateDevice({ facilityId }: Props) {
  const { t } = useTranslation();
  const [qParams] = useQueryParams<{ type?: string }>();
  const pluginDevices = usePluginDevices();

  const device = pluginDevices.find((device) => device.type === qParams.type);

  const Icon = device?.icon || CubeIcon;

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      <div className="inline-flex items-center">
        <Icon className="size-5 mr-2" />
        <span className="text-2xl font-bold">
          {t("add")}{" "}
          {qParams.type && (
            <>{qParams.type.charAt(0).toUpperCase() + qParams.type.slice(1)} </>
          )}
          {t("device")}
        </span>
      </div>
      <Separator />

      <div className="pt-4">
        <DeviceForm
          facilityId={facilityId}
          onSuccess={() => {
            toast.success(t("device_registered"));
            navigate(`/facility/${facilityId}/settings/devices`);
          }}
        />
      </div>
    </div>
  );
}
