import { navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Separator } from "@/components/ui/separator";

import DeviceForm from "@/pages/Facility/settings/devices/components/DeviceForm";

import DeviceTypeIcon from "./components/DeviceTypeIcon";

interface Props {
  facilityId: string;
}

export default function CreateDevice({ facilityId }: Props) {
  const { t } = useTranslation();
  const [qParams] = useQueryParams<{ type?: string }>();

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      <div className="inline-flex items-center">
        <DeviceTypeIcon type={qParams.type} className="size-5 mr-2" />
        <span className="text-2xl font-bold capitalize">
          {qParams.type
            ? t("add_device_with_type", {
                type: qParams.type,
              })
            : t("add_device")}
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
