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

import FacilityForm from "@/components/Facility/FacilityForm";

interface Props {
  organizationId?: string;
  facilityId: string;
  trigger?: React.ReactNode;
}

export default function EditFacilitySheet({ facilityId, trigger }: Props) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("edit_facility")}</SheetTitle>
          <SheetDescription>{t("update_existing_facility")}</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <FacilityForm
            facilityId={facilityId}
            onSubmitSuccess={() => {
              setOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
