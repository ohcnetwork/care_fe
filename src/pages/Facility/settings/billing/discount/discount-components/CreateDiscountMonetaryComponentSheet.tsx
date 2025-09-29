import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
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
import { DiscountMonetaryComponentForm } from "@/pages/Facility/settings/billing/discount/discount-components/DiscountMonetaryComponentForm";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import facilityApi from "@/types/facility/facilityApi";

export function CreateDiscountMonetaryComponentSheet() {
  const { t } = useTranslation();
  const { facility, facilityId } = useCurrentFacility();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate: createComponent } = useMutation({
    mutationFn: mutate(facilityApi.setMonetaryComponents, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility", facilityId] });
      toast.success(t("discount_component_created"));
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon className="size-4 mr-2" />
          {t("create_discount_component")}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("create_discount_component")}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <DiscountMonetaryComponentForm
            onSubmit={(data) => {
              if (!facility) {
                return;
              }

              setOpen(false);
              createComponent({
                discount_monetary_components: [
                  ...(facility.discount_monetary_components ?? []),
                  data,
                ],
                discount_codes: facility.discount_codes,
              });
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
