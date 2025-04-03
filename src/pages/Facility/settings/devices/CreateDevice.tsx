import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Separator } from "@/components/ui/separator";

import PageTitle from "@/components/Common/PageTitle";

import DeviceForm from "@/pages/Facility/settings/devices/components/DeviceForm";

interface Props {
  facilityId: string;
}

export default function CreateDevice({ facilityId }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      <PageTitle title={t("add_device")} />
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
