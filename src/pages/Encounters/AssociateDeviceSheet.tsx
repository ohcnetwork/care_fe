import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import mutate from "@/Utils/request/mutate";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useBreakpoints from "@/hooks/useBreakpoints";
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
  const isMobile = useBreakpoints({ default: true, sm: false });

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

  return isMobile ? (
    <Drawer
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        setSelectedDevice(null);
      }}
    >
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="font-semibold text-xl">
            {t("associate_device")}
          </DrawerTitle>
          <DrawerDescription>
            {t("associate_device_description")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-6">{deviceSearch}</div>
        <DrawerFooter>{footerButton}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  ) : (
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
        <div className="py-6">{deviceSearch}</div>
        <SheetFooter>{footerButton}</SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
