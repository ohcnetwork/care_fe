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

interface EditServiceHistorySheetProps {
  facilityId: string;
  deviceId: string;
  serviceRecord: ServiceHistory;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function EditServiceHistorySheet({
  facilityId,
  deviceId,
  serviceRecord,
  open,
  setOpen,
}: EditServiceHistorySheetProps) {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
            onSubmitSuccess={() => {
              setOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
