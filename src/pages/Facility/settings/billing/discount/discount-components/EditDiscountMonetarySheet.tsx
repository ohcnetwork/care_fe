import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import { AnnotatedMonetaryComponent } from "@/pages/Facility/settings/billing/discount/discount-components/DiscountComponentSettings";
import { DiscountMonetaryComponentForm } from "@/pages/Facility/settings/billing/discount/discount-components/DiscountMonetaryComponentForm";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import facilityApi from "@/types/facility/facilityApi";

export function EditDiscountMonetarySheet({
  component,
  disabled = false,
}: {
  component: AnnotatedMonetaryComponent;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { facility, facilityId } = useCurrentFacility();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate: updateComponent, isPending } = useMutation({
    mutationFn: mutate(facilityApi.updateMonetaryComponents, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility", facilityId] });
      toast.success(t("discount_component_updated"));
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled || isPending}>
          <PencilIcon className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("edit_discount_component")}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <DiscountMonetaryComponentForm
            defaultValues={component}
            onSubmit={(data) => {
              if (!facility) {
                return;
              }

              setOpen(false);

              const updatedComponents =
                facility.discount_monetary_components.map((existing, index) =>
                  index === component.facilityIndex ? data : existing,
                );

              updateComponent({
                discount_monetary_components: updatedComponents,
                discount_codes: facility.discount_codes,
              });
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
