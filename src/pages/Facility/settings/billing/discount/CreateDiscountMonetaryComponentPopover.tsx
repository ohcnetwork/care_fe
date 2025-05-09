import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { DiscountMonetaryComponentForm } from "@/pages/Facility/settings/billing/discount/DiscountMonetaryComponentForm";
import { MonetaryComponentRead } from "@/types/base/monetaryComponent/monetaryComponent";
import { Code } from "@/types/questionnaire/code";

export function CreateDiscountMonetaryComponentPopover(props: {
  onSubmit: (data: MonetaryComponentRead) => void;
  systemCodes: Code[];
  facilityCodes: Code[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon />
          Create Discount Component
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="pt-4">
          <DiscountMonetaryComponentForm
            onSubmit={(data) => {
              setOpen(false);
              props.onSubmit(data);
            }}
            systemCodes={props.systemCodes}
            facilityCodes={props.facilityCodes}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
