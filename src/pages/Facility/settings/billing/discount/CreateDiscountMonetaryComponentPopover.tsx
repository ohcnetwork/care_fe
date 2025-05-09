import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import mutate from "@/Utils/request/mutate";
import { DiscountMonetaryComponentForm } from "@/pages/Facility/settings/billing/discount/DiscountMonetaryComponentForm";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import facilityApi from "@/types/facility/facilityApi";

export function CreateDiscountMonetaryComponentPopover() {
  const { t } = useTranslation();
  const facility = useCurrentFacility();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate: createComponent } = useMutation({
    mutationFn: mutate(facilityApi.updateMonetaryComponents, {
      pathParams: { facilityId: facility?.id ?? "" },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility", facility?.id] });
      toast.success(t("discount_component_created"));
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon />
          {t("create_discount_component")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
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
      </PopoverContent>
    </Popover>
  );
}
