import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetBody,
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
  /** Control the sheet from outside, e.g. when opened from a menu item. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditFacilitySheet({
  facilityId,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const { t } = useTranslation();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent size="lg" className="overflow-hidden">
        <SheetHeader>
          <SheetTitle>{t("edit_facility")}</SheetTitle>
          <SheetDescription>{t("update_existing_facility")}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <FacilityForm
            facilityId={facilityId}
            onSubmitSuccess={() => {
              setOpen(false);
            }}
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
