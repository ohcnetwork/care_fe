import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
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

interface AddServiceHistorySheetProps {
  facilityId: string;
  deviceId: string;
  onServiceCreated?: (service: ServiceHistory) => void;
}

export default function AddServiceHistorySheet({
  facilityId,
  deviceId,
  onServiceCreated,
}: AddServiceHistorySheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <Plus className="size-4 mr-2" />
          {t("service_record_add")}
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-full sm:max-w-2xl overflow-y-auto"
        data-cy="add-service-form"
      >
        <SheetHeader>
          <SheetTitle>{t("service_record_add")}</SheetTitle>
          <SheetDescription>{t("service_record_description")}</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <ServiceHistoryForm
            facilityId={facilityId}
            deviceId={deviceId}
            onSubmitSuccess={(service) => {
              onServiceCreated?.(service);
              setOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
