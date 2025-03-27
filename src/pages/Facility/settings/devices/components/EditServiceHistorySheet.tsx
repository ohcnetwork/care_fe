import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { ServiceHistory } from "@/types/device/device";

import ServiceHistoryForm from "./ServiceHistoryForm";

interface EditServiceHistorySheetProps {
  facilityId: string;
  deviceId: string;
  serviceRecord: ServiceHistory;
  onServiceUpdated?: (service: ServiceHistory) => void;
  trigger?: React.ReactNode;
}

export default function EditServiceHistorySheet({
  facilityId,
  deviceId,
  serviceRecord,
  onServiceUpdated,
  trigger,
}: EditServiceHistorySheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        className="w-full sm:max-w-2xl overflow-y-auto"
        data-cy="edit-service-form"
      >
        <SheetHeader>
          <SheetTitle>{t("service_record_edit")}</SheetTitle>
          <SheetDescription>{t("service_record_description")}</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <ServiceHistoryForm
            facilityId={facilityId}
            deviceId={deviceId}
            serviceRecord={serviceRecord}
            onSubmitSuccess={(service) => {
              onServiceUpdated?.(service);
              setOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
