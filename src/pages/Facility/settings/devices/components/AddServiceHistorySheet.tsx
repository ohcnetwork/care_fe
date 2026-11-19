import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
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
        <Button variant="outline_primary" size="sm">
          <Plus />
          {t("service_record_add")}
        </Button>
      </SheetTrigger>
      <SheetContent size="md" className="overflow-hidden">
        <SheetHeader>
          <SheetTitle>{t("service_record_add")}</SheetTitle>
          <SheetDescription>{t("service_record_description")}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <ServiceHistoryForm
            facilityId={facilityId}
            deviceId={deviceId}
            onSubmitSuccess={(service) => {
              onServiceCreated?.(service);
              setOpen(false);
            }}
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
