import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { ServiceHistory } from "@/types/device/device";

import ServiceHistoryForm from "./ServiceHistoryForm";

interface ServiceHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  deviceId: string;
  serviceRecord?: ServiceHistory | null;
}

export default function ServiceHistorySheet({
  open,
  onOpenChange,
  facilityId,
  deviceId,
  serviceRecord,
}: ServiceHistorySheetProps) {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {serviceRecord ? t("service_record_edit") : t("service_record_add")}
          </SheetTitle>
          <SheetDescription>{t("service_record_description")}</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <ServiceHistoryForm
            facilityId={facilityId}
            deviceId={deviceId}
            serviceRecord={serviceRecord}
            onOpenChange={onOpenChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
