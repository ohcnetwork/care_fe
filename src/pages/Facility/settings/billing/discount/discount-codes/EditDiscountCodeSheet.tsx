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
import { DiscountCodeForm } from "@/pages/Facility/settings/billing/discount/discount-codes/DiscountCodeForm";
import { AnnotatedDiscountCode } from "@/pages/Facility/settings/billing/discount/discount-codes/DiscountCodeSettings";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import facilityApi from "@/types/facility/facilityApi";

export function EditDiscountCodeSheet({
  code,
  disabled = false,
}: {
  code: AnnotatedDiscountCode;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { facility, facilityId } = useCurrentFacility();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate: updateCode, isPending } = useMutation({
    mutationFn: mutate(facilityApi.setMonetaryComponents, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility", facilityId] });
      toast.success(t("discount_code_updated"));
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
          <SheetTitle>{t("edit_discount_code")}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <DiscountCodeForm
            defaultValues={code}
            onSubmit={(data) => {
              if (!facility) {
                return;
              }

              setOpen(false);

              const updatedCodes = facility.discount_codes.map(
                (existing, index) =>
                  index === code.facilityIndex ? data : existing,
              );

              updateCode({
                discount_codes: updatedCodes,
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
