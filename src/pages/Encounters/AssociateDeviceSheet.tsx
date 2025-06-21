import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
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

  return (
    <Sheet
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        setSelectedDevice(null);
      }}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
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
            disabled={!selectedDevice || isAssociatingDevice}
          >
            <CareIcon icon="l-link-add" className="h-4" />
            {isAssociatingDevice ? t("associating") : t("associate")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
