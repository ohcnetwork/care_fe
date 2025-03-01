import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import { DeviceSearch } from "@/pages/Facility/settings/devices/DeviceSearch";
import { DeviceList } from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  encounterId: string;
}

export default function AssociateDeviceSheet({
  open,
  onOpenChange,
  facilityId,
  encounterId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedDevice, setSelectedDevice] = useState<DeviceList | null>(null);

  const { mutate: associateDevice, isPending } = useMutation({
    mutationFn: mutate(deviceApi.associateEncounter, {
      pathParams: { facilityId, id: selectedDevice?.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["devices", facilityId],
      });
      toast.success(t("device_associated_successfully"));
      onOpenChange(false);
      setSelectedDevice(null);
    },
  });

  const handleSubmit = () => {
    if (!selectedDevice) return;
    associateDevice({ encounter: encounterId });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("associate_device")}</SheetTitle>
          <SheetDescription>
            {t("associate_device_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <DeviceSearch
            facilityId={facilityId}
            onSelect={setSelectedDevice}
            value={selectedDevice}
          />
        </div>
        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={!selectedDevice || isPending}
          >
            {isPending ? t("associating") : t("associate")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
