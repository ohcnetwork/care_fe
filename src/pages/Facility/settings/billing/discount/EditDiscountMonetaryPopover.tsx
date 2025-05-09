import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
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
import { AnnotatedMonetaryComponent } from "@/pages/Facility/settings/billing/discount/DiscountComponentSettings";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import facilityApi from "@/types/facility/facilityApi";

import { DiscountMonetaryComponentForm } from "./DiscountMonetaryComponentForm";

export function EditDiscountMonetaryPopover({
  component,
  disabled = false,
}: {
  component: AnnotatedMonetaryComponent;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const facility = useCurrentFacility();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate: updateComponent, isPending } = useMutation({
    mutationFn: mutate(facilityApi.updateMonetaryComponents, {
      pathParams: { facilityId: facility?.id ?? "" },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility", facility?.id] });
      toast.success(t("discount_component_updated"));
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled || isPending}>
          <PencilIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <DiscountMonetaryComponentForm
          defaultValues={component}
          onSubmit={(data) => {
            if (!facility) {
              return;
            }

            setOpen(false);

            const updatedComponents = facility.discount_monetary_components.map(
              (existing, index) =>
                index === component.facilityIndex ? data : existing,
            );

            updateComponent({
              discount_monetary_components: updatedComponents,
              discount_codes: facility.discount_codes,
            });
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
