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
import { DiscountCodeForm } from "@/pages/Facility/settings/billing/discount/discount-codes/DiscountCodeForm";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import facilityApi from "@/types/facility/facilityApi";

export function CreateDiscountCodeSheet() {
  const { t } = useTranslation();
  const { facility, facilityId } = useCurrentFacility();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate: createCode } = useMutation({
    mutationFn: mutate(facilityApi.setMonetaryComponents, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility", facility?.id] });
      toast.success(t("discount_code_created"));
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon className="size-4 mr-2" />
          {t("create_discount_code")}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("create_discount_code")}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <DiscountCodeForm
            onSubmit={(data) => {
              if (!facility) {
                return;
              }

              setOpen(false);
              createCode({
                discount_codes: [...(facility.discount_codes ?? []), data],
                discount_monetary_components:
                  facility.discount_monetary_components,
              });
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
