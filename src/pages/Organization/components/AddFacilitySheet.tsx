import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

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

import FacilityForm from "@/components/Facility/FacilityForm";

interface Props {
  organizationId: string;
}

export default function AddFacilitySheet({ organizationId }: Props) {
  const { t } = useTranslation();

  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <CareIcon icon="l-plus" className="mr-2 size-4" />
          {t("add_facility")}
        </Button>
      </SheetTrigger>
      <SheetContent size="lg" className="overflow-hidden">
        <SheetHeader>
          <SheetTitle>{t("add_new_facility")}</SheetTitle>
          <SheetDescription>{t("create_new_facility")}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <FacilityForm
            organizationId={organizationId}
            onSubmitSuccess={() => {
              setOpen(false);
              queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            }}
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
