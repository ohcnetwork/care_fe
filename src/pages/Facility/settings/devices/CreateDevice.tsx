import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import DeviceForm from "@/pages/Facility/settings/devices/components/DeviceForm";

interface Props {
  facilityId: string;
}

export default function CreateDevice({ facilityId }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("add_device")}</h2>
        <p className="text-muted-foreground">{t("add_device_description")}</p>
      </div>

      <div className="mt-6">
        <DeviceForm
          facilityId={facilityId}
          onSuccess={() => {
            navigate(`/facility/${facilityId}/settings/devices`);
          }}
        />
      </div>
    </div>
  );
}
