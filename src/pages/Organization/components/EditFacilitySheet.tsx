import { useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
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
}

export default function EditFacilitySheet({ facilityId }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  console.log(open);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="link"
          data-cy="edit-facility-button"
          className="text-primary text-sm"
        >
          <CareIcon icon="l-edit" className="mr-1 h-4 w-4" />
          {t("edit_facility")}
        </Button>
      </SheetTrigger>
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
              queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
