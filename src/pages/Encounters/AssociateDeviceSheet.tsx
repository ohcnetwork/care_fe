import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import mutate from "@/Utils/request/mutate";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DeviceSearch } from "@/pages/Facility/settings/devices/components/DeviceSelector";
import { DeviceList } from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";

interface Props {
  facilityId: string;
  encounterId: string;
  children?: React.ReactNode;
}

export default function AssociateDeviceSheet({
  facilityId,
  encounterId,
  children,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedDevice, setSelectedDevice] = useState<DeviceList | null>(null);
  const [open, setOpen] = useState(false);

  const { mutate: associateDevice, isPending: isAssociatingDevice } =
    useMutation({
      mutationFn: mutate(deviceApi.associateEncounter, {
        pathParams: { facilityId, deviceId: selectedDevice?.id },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["devices", facilityId] });
        toast.success(t("device_associated_successfully"));
        setOpen(false);
        setSelectedDevice(null);
      },
    });

  const handleSubmit = () => {
    if (!selectedDevice) return;
    associateDevice({ encounter: encounterId });
  };

  const deviceSearch = (
    <DeviceSearch
      facilityId={facilityId}
      onSelect={setSelectedDevice}
      value={selectedDevice}
    />
  );

  const footerButton = (
    <Button
      onClick={handleSubmit}
      disabled={!selectedDevice || isAssociatingDevice}
    >
      {isAssociatingDevice ? t("associating") : t("associate")}
    </Button>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        setSelectedDevice(null);
      }}
      mobile="drawer"
      desktop="sheet"
      breakpoint="sm"
      trigger={children}
      title={t("associate_device")}
      titleClassName="text-xl"
      description={t("associate_device_description")}
      footer={footerButton}
      mobileBodyClassName="px-4 py-6"
      desktopBodyClassName="py-6"
    >
      {deviceSearch}
    </ResponsiveDialog>
  );
}
