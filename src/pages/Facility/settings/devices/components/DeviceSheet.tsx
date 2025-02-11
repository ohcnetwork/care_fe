import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import DeviceForm from "@/pages/Facility/settings/devices/components/DeviceForm";
import { DeviceList } from "@/types/device/device";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  device?: DeviceList;
}

export default function DeviceSheet({
  open,
  onOpenChange,
  facilityId,
  device,
}: Props) {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{device ? t("edit_device") : t("add_device")}</SheetTitle>
          <SheetDescription>
            {device
              ? t("edit_device_description")
              : t("add_device_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <DeviceForm facilityId={facilityId} device={device} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
